import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { expenseClaims, expenseClaimApprovals, employees } from '@hybrid-hris/db/schema';
import { ExpenseClaim } from '@hybrid-hris/db/types';
import { ExpenseClaimStatus, ExpenseApprovalStatus, BudgetLedgerEntryType } from '@hybrid-hris/domain';
import { eq, and, inArray, or, SQL, ne } from 'drizzle-orm';
import { BudgetLedgerService } from './budget-ledger.service';
import { UsersService } from 'src/identity/users/users.service';
import { OrgUnitsService } from '../org-units/org-units.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExpenseClaimsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly ledgerService: BudgetLedgerService,
        private readonly usersService: UsersService,
        private readonly orgUnitsService: OrgUnitsService,
        private readonly auditService: AuditService,
    ) { }

    async submitClaim(data: {
        employeeId: string;
        orgUnitId: string;
        expenseCategoryId: string;
        budgetPeriodId: string;
        amount: string;
        expenseDate: string;
        description: string;
    }, actorId: string): Promise<ExpenseClaim> {
        // Validation: Check remaining budget (Soft mode: allow but maybe flag? for now let's just check)
        const remaining = await this.ledgerService.getRemainingBudget(
            data.orgUnitId,
            data.budgetPeriodId,
            data.expenseCategoryId
        );

        if (remaining < parseFloat(data.amount)) {
            // Optional: Hard block or just warning. Let's do a hard block for now to be safe.
            // throw new BadRequestException(`Insufficient budget. Remaining: ${remaining}`);
        }

        const [inserted] = await this.db.db.insert(expenseClaims).values({
            employeeId: data.employeeId,
            orgUnitId: data.orgUnitId,
            expenseCategoryId: data.expenseCategoryId,
            budgetPeriodId: data.budgetPeriodId,
            amount: data.amount,
            expenseDate: data.expenseDate,
            description: data.description,
            status: ExpenseClaimStatus.SUBMITTED,
            submittedAt: new Date(),
        }).returning();

        await this.auditService.log({
            userId: actorId,
            action: 'CREATE',
            entityType: 'ExpenseClaim',
            entityId: inserted.id,
            newValue: inserted,
        });

        return inserted;
    }

    async approveClaim(claimId: string, approverUserId: string, level: number, remarks?: string): Promise<{ success: boolean }> {
        const claim = await this.getValidatedApprovalAuthority(approverUserId, claimId);

        return this.db.withTransaction(async (tx) => {
            // 1. Record the approval
            await tx.insert(expenseClaimApprovals).values({
                expenseClaimId: claimId,
                approverUserId,
                level,
                status: ExpenseApprovalStatus.APPROVED,
                actedAt: new Date(),
                remarks,
            });

            // 2. If it's the final level (e.g., Level 2 or 3 depending on policy), mark claim as APPROVED and commit to ledger
            // For MVP, let's say Level 2 is final approval.
            if (level >= 2) {
                const [updated] = await tx
                    .update(expenseClaims)
                    .set({
                        status: ExpenseClaimStatus.APPROVED,
                        approvedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(expenseClaims.id, claimId))
                    .returning();

                await this.auditService.log({
                    userId: approverUserId,
                    action: 'APPROVE',
                    entityType: 'ExpenseClaim',
                    entityId: claimId,
                    oldValue: claim,
                    newValue: updated,
                    metadata: { level, remarks }
                });

                // 3. Insert ledger consumption (negative amount)
                await this.ledgerService.createEntry(tx, {
                    orgUnitId: claim.orgUnitId,
                    budgetPeriodId: claim.budgetPeriodId,
                    expenseCategoryId: claim.expenseCategoryId,
                    entryType: BudgetLedgerEntryType.CONSUMPTION,
                    amount: (parseFloat(claim.amount) * -1).toString(),
                    referenceExpenseClaimId: claimId,
                });
            } else {
                 await this.auditService.log({
                    userId: approverUserId,
                    action: 'APPROVE_LEVEL',
                    entityType: 'ExpenseClaim',
                    entityId: claimId,
                    metadata: { level, remarks }
                });
            }

            return { success: true };
        });
    }

    /**
     * Internal helper to validate if a user has authority to act on a pending expense claim.
     */
    private async getValidatedApprovalAuthority(userId: string, claimId: string) {
        const [claim] = await this.db.db
            .select()
            .from(expenseClaims)
            .where(eq(expenseClaims.id, claimId))
            .limit(1);

        if (!claim) throw new NotFoundException('Expense claim not found');
        if (claim.status !== ExpenseClaimStatus.SUBMITTED) {
            throw new BadRequestException('Claim is not in SUBMITTED status');
        }

        // Fetch current user profile for role and lead status
        const user = await this.usersService.getUserFullProfile(userId);
        if (!user) throw new ForbiddenException('User profile not found');

        const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('HR_ADMIN');
        const isRoot = user.isRootLeader;

        // Authority Check
        let hasAuthority = false;

        if (isAdmin || isRoot) {
            hasAuthority = true;
        } else if (user.ledOrgUnitIds.length > 0) {
            // Case 1: In direct team
            if (user.ledOrgUnitIds.includes(claim.orgUnitId)) {
                hasAuthority = true;
            } else {
                // Case 2: In child team AND requester is a leader there
                const childIds = await this.orgUnitsService.getDescendantOrgUnitIds(user.ledOrgUnitIds);
                if (childIds.includes(claim.orgUnitId)) {
                    const childLeadEmployeeIds = await this.orgUnitsService.getOrgUnitLeaderEmployeeIds([claim.orgUnitId]);
                    if (childLeadEmployeeIds.includes(claim.employeeId)) {
                        hasAuthority = true;
                    }
                }
            }
        }

        if (!hasAuthority) {
            throw new ForbiddenException('You do not have authority to act on this expense claim');
        }

        return claim;
    }

    async getMyClaims(employeeId: string): Promise<ExpenseClaim[]> {
        return this.db.db
            .select()
            .from(expenseClaims)
            .where(eq(expenseClaims.employeeId, employeeId));
    }

    async getPendingForApproval(userId: string): Promise<Record<string, unknown>[]> {
        // Internal user lookup for structural flags
        const user = await this.usersService.getUserFullProfile(userId);
        if (!user) return [];

        const isPowerUser = user.roles.includes('ADMIN') || user.roles.includes('HR_ADMIN');
        const isRootLeader = user.isRootLeader;
        const directIds = user.ledOrgUnitIds;
        const isAnyLead = directIds.length > 0;

        const conditions: (SQL | undefined)[] = [
            eq(expenseClaims.status, ExpenseClaimStatus.SUBMITTED)
        ];

        // Never allow self-approval EXCEPT for root leaders
        if (!isRootLeader) {
            conditions.push(ne(expenseClaims.employeeId, user.employeeId ?? ''));
        }

        if (!isPowerUser) {
            // 1. Get child units recursively if user is a lead
            if (isAnyLead) {
                const childIds = await this.orgUnitsService.getDescendantOrgUnitIds(directIds);

                // 2. Filter: (In direct unit) OR (In child unit AND is a leader)
                if (childIds.length > 0) {
                    const childLeadEmployeeIds = await this.orgUnitsService.getOrgUnitLeaderEmployeeIds(childIds);

                    const hierarchyConditions: (SQL | undefined)[] = [
                        inArray(expenseClaims.orgUnitId, directIds)
                    ];

                    if (childLeadEmployeeIds.length > 0) {
                        hierarchyConditions.push(
                            and(
                                inArray(expenseClaims.orgUnitId, childIds),
                                inArray(expenseClaims.employeeId, childLeadEmployeeIds)
                            )
                        );
                    }

                    conditions.push(or(...hierarchyConditions));
                } else {
                    conditions.push(inArray(expenseClaims.orgUnitId, directIds));
                }
            } else {
                // Not a lead and not an admin -> can't see anything in the queue
                return [];
            }
        }
        return this.db.db
            .select({
                claim: expenseClaims,
                employee: {
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                }
            })
            .from(expenseClaims)
            .innerJoin(employees, eq(employees.id, expenseClaims.employeeId))
            .where(and(...conditions))
            .orderBy(expenseClaims.submittedAt);
    }
}

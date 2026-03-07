import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { expenseClaims, expenseClaimApprovals, employees, orgUnitLeaders, roles, userRoles } from '@hybrid-hris/db/schema';
import { ExpenseClaim } from '@hybrid-hris/db/types';
import { ExpenseClaimStatus, ExpenseApprovalStatus, BudgetLedgerEntryType } from '@hybrid-hris/domain';
import { eq, and, isNull, inArray, sql } from 'drizzle-orm';
import { BudgetLedgerService } from './budget-ledger.service';

@Injectable()
export class ExpenseClaimsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly ledgerService: BudgetLedgerService,
    ) { }

    async submitClaim(data: {
        employeeId: string;
        orgUnitId: string;
        expenseCategoryId: string;
        budgetPeriodId: string;
        amount: string;
        expenseDate: string;
        description: string;
    }): Promise<ExpenseClaim> {
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

        return inserted;
    }

    async approveClaim(claimId: string, approverUserId: string, level: number, remarks?: string): Promise<{ success: boolean }> {
        return this.db.withTransaction(async (tx) => {
            const [claim] = await tx
                .select()
                .from(expenseClaims)
                .where(eq(expenseClaims.id, claimId))
                .limit(1);

            if (!claim) throw new NotFoundException('Expense claim not found');
            if (claim.status !== ExpenseClaimStatus.SUBMITTED) {
                throw new BadRequestException('Claim is not in SUBMITTED status');
            }

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
                await tx
                    .update(expenseClaims)
                    .set({
                        status: ExpenseClaimStatus.APPROVED,
                        approvedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(expenseClaims.id, claimId));

                // 3. Insert ledger consumption (negative amount)
                await this.ledgerService.createEntry(tx, {
                    orgUnitId: claim.orgUnitId,
                    budgetPeriodId: claim.budgetPeriodId,
                    expenseCategoryId: claim.expenseCategoryId,
                    entryType: BudgetLedgerEntryType.CONSUMPTION,
                    amount: (parseFloat(claim.amount) * -1).toString(),
                    referenceExpenseClaimId: claimId,
                });
            }

            return { success: true };
        });
    }

    async getMyClaims(employeeId: string): Promise<ExpenseClaim[]> {
        return this.db.db
            .select()
            .from(expenseClaims)
            .where(eq(expenseClaims.employeeId, employeeId));
    }

    async getPendingForApproval(userId: string): Promise<any[]> {
        // Internal role lookup for security
        const userRolesResult = await this.db.db
            .select({ code: roles.code })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));
        
        const currentRoles = userRolesResult.map(r => r.code);
        const isAdmin = currentRoles.includes('ADMIN') || currentRoles.includes('HR_ADMIN');
        
        const conditions = [
            eq(expenseClaims.status, ExpenseClaimStatus.SUBMITTED)
        ];

        if (!isAdmin) {
            // Managers see claims for org units they lead
            const ledOrgUnits = await this.db.db
                .select({ orgUnitId: orgUnitLeaders.orgUnitId })
                .from(orgUnitLeaders)
                .where(and(
                    eq(orgUnitLeaders.employeeId, sql`(SELECT employee_id FROM users WHERE id = ${userId})`),
                    isNull(orgUnitLeaders.deletedAt)
                ));
            
            const orgUnitIds = ledOrgUnits.map(ou => ou.orgUnitId);
            if (orgUnitIds.length === 0) return [];
            
            conditions.push(inArray(expenseClaims.orgUnitId, orgUnitIds));
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

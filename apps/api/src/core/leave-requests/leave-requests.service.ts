import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { SystemRole } from '@hybrid-hris/domain'
import { UsersService } from 'src/identity/users/users.service'
import {
    leaveRequests,
    leaveRequestApprovals,
    leaveLedger,
    leaveTypes,
    employees,
    users,
    userRoles,
    roles,
    orgUnits,
    orgUnitLeaders,
} from '@hybrid-hris/db/schema'
import {
    eq,
    and,
    or,
    ilike,
    sql,
    desc,
    gte,
    lte,
    ne,
    isNull,
    inArray,
    SQL,
} from 'drizzle-orm'

// ──────────────────────────────────────────────────────────
// DTOs (inline for brevity — extract to dto/ if needed later)
// ──────────────────────────────────────────────────────────
export interface CreateLeaveRequestDto {
    leaveTypeId: string
    startDate: string      // YYYY-MM-DD
    endDate: string        // YYYY-MM-DD
    startDayType: 'FULL' | 'HALF'
    endDayType: 'FULL' | 'HALF'
    notes?: string
}

export interface ActOnLeaveRequestDto {
    remarks?: string
}

export interface LeaveRequestFilterDto {
    page?: number
    limit?: number
    search?: string
}

import { OrgUnitsService } from '../org-units/org-units.service'

// ... (keep DTOs)

@Injectable()
export class LeaveRequestsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly usersService: UsersService,
        private readonly orgUnitsService: OrgUnitsService,
    ) { }

    // ─── helpers ────────────────────────────────────────────

    /** Compute working days (calendar days) between two ISO date strings */
    private computeDays(
        startDate: string,
        endDate: string,
        startDayType: 'FULL' | 'HALF',
        endDayType: 'FULL' | 'HALF',
    ): number {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffMs = end.getTime() - start.getTime()
        const calendarDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1

        let total = calendarDays
        if (startDayType === 'HALF') total -= 0.5
        // End deduction only meaningful for multi-day requests
        if (calendarDays > 1 && endDayType === 'HALF') total -= 0.5

        return total
    }

    /** Get the latest ledger balance for an employee + leaveType */
    private async getBalance(employeeId: string, leaveTypeId: string): Promise<number> {
        const [row] = await this.db.db
            .select({ balance: leaveLedger.balance })
            .from(leaveLedger)
            .where(
                and(
                    eq(leaveLedger.employeeId, employeeId),
                    eq(leaveLedger.leaveTypeId, leaveTypeId),
                ),
            )
            .orderBy(desc(leaveLedger.createdAt))
            .limit(1)

        return row ? parseFloat(row.balance) : 0
    }

    /** Resolve the approver userId — priorities: 1. Direct Supervisor, 2. Root Self-Approval, 3. HR_ADMIN */
    private async resolveApproverUserId(requesterEmployeeId: string): Promise<string | null> {
        // 1. Try to get the userId of the requester's supervisor
        const [supervisor] = await this.db.db
            .select({ userId: users.id })
            .from(employees)
            .innerJoin(users, eq(users.employeeId, employees.supervisorId))
            .where(and(
                eq(employees.id, requesterEmployeeId),
                eq(users.isActive, true)
            ))
            .limit(1);

        if (supervisor?.userId) {
            return supervisor.userId;
        }

        // 2. Special case: Root Org Leader approves their own
        const isRoot = await this.orgUnitsService.isRootLeader(requesterEmployeeId);
        if (isRoot) {
            const [rootUser] = await this.db.db
                .select({ userId: users.id })
                .from(users)
                .where(eq(users.employeeId, requesterEmployeeId))
                .limit(1);
            if (rootUser) return rootUser.userId;
        }

        // 3. Fallback: Prefer HR_ADMIN, then ADMIN
        const [hrApprover] = await this.db.db
            .select({ userId: userRoles.userId })
            .from(userRoles)
            .innerJoin(roles, eq(roles.id, userRoles.roleId))
            .innerJoin(users, eq(users.id, userRoles.userId))
            .where(
                and(
                    inArray(roles.code, [SystemRole.HR_ADMIN, SystemRole.ADMIN]),
                    eq(users.isActive, true),
                    // If fallback is needed, still ensure it's not the requester (unless they are root)
                    ne(users.employeeId, requesterEmployeeId)
                ),
            )
            .limit(1)

        if (hrApprover?.userId) {
            return hrApprover.userId;
        }

        // 4. Ultimate Fallback: The Root Org Leader
        const [rootOrg] = await this.db.db
            .select({ id: orgUnits.id })
            .from(orgUnits)
            .where(isNull(orgUnits.parentId))
            .limit(1);
        
        if (rootOrg) {
            const [rootLeader] = await this.db.db
                .select({ userId: users.id })
                .from(orgUnitLeaders)
                .innerJoin(users, eq(users.employeeId, orgUnitLeaders.employeeId))
                .where(and(
                    eq(orgUnitLeaders.orgUnitId, rootOrg.id),
                    isNull(orgUnitLeaders.deletedAt),
                    eq(users.isActive, true)
                ))
                .limit(1);
            
            if (rootLeader) return rootLeader.userId;
        }

        return null;
    }

    // ─── public API ──────────────────────────────────────────

    /**
     * My leave requests — last 12 months, newest first.
     * Returns request + leaveType name + approval remarks.
     */
    async getMyRequests(employeeId: string) {
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
        const cutoff = twelveMonthsAgo.toISOString().split('T')[0]

        const rows = await this.db.db
            .select({
                id: leaveRequests.id,
                leaveTypeId: leaveRequests.leaveTypeId,
                leaveTypeName: leaveTypes.name,
                startDate: leaveRequests.startDate,
                endDate: leaveRequests.endDate,
                startDayType: leaveRequests.startDayType,
                endDayType: leaveRequests.endDayType,
                days: leaveRequests.days,
                notes: leaveRequests.notes,
                status: leaveRequests.status,
                approvedAt: leaveRequests.approvedAt,
                createdAt: leaveRequests.createdAt,
                // Latest approval action
                approvalStatus: leaveRequestApprovals.status,
                approvalRemarks: leaveRequestApprovals.remarks,
                approvalActedAt: leaveRequestApprovals.actedAt,
            })
            .from(leaveRequests)
            .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
            .leftJoin(
                leaveRequestApprovals,
                and(
                    eq(leaveRequestApprovals.leaveRequestId, leaveRequests.id),
                    eq(leaveRequestApprovals.level, 1),
                ),
            )
            .where(
                and(
                    eq(leaveRequests.employeeId, employeeId),
                    gte(leaveRequests.startDate, cutoff),
                ),
            )
            .orderBy(desc(leaveRequests.createdAt))

        return rows.map((r) => ({
            ...r,
            days: parseFloat(r.days as unknown as string),
        }))
    }

    /**
     * My leave balances — latest ledger entry per leave type.
     * Also includes pending days (sum of PENDING requests for each type).
     */
    async getMyBalance(employeeId: string) {
        // Get all active leave types that the employee has a policy rule for
        // Fall back: all active leave types
        const activeLeaveTypes = await this.db.db
            .select({ id: leaveTypes.id, name: leaveTypes.name, isPaid: leaveTypes.isPaid })
            .from(leaveTypes)
            .where(sql`${leaveTypes.deletedAt} IS NULL`)
            .orderBy(leaveTypes.name)

        const balances = await Promise.all(
            activeLeaveTypes.map(async (lt) => {
                const balance = await this.getBalance(employeeId, lt.id)

                // Pending days — sum of PENDING requests
                const [pendingRow] = await this.db.db
                    .select({ total: sql<string>`COALESCE(SUM(days), 0)` })
                    .from(leaveRequests)
                    .where(
                        and(
                            eq(leaveRequests.employeeId, employeeId),
                            eq(leaveRequests.leaveTypeId, lt.id),
                            eq(leaveRequests.status, 'PENDING'),
                        ),
                    )

                return {
                    leaveTypeId: lt.id,
                    leaveTypeName: lt.name,
                    isPaid: lt.isPaid,
                    balance,
                    pendingDays: parseFloat(pendingRow?.total ?? '0'),
                }
            }),
        )

        return balances
    }

    /**
     * Submit a new leave request.
     */
    async create(
        userId: string,
        employeeId: string,
        dto: CreateLeaveRequestDto,
    ) {
        // Validate date order
        if (dto.endDate < dto.startDate) {
            throw new BadRequestException('End date must be on or after start date')
        }

        // Compute total days
        const days = this.computeDays(
            dto.startDate,
            dto.endDate,
            dto.startDayType,
            dto.endDayType,
        )
        if (days <= 0) {
            throw new BadRequestException('Total days must be greater than 0')
        }

        // Verify leave type exists
        const [lt] = await this.db.db
            .select({ id: leaveTypes.id })
            .from(leaveTypes)
            .where(and(eq(leaveTypes.id, dto.leaveTypeId), sql`${leaveTypes.deletedAt} IS NULL`))
        if (!lt) {
            throw new BadRequestException('Invalid leave type')
        }

        // Check for overlapping PENDING or APPROVED requests
        const overlap = await this.db.db
            .select({ id: leaveRequests.id })
            .from(leaveRequests)
            .where(
                and(
                    eq(leaveRequests.employeeId, employeeId),
                    inArray(leaveRequests.status, ['PENDING', 'APPROVED']),
                    lte(leaveRequests.startDate, dto.endDate),
                    gte(leaveRequests.endDate, dto.startDate),
                ),
            )
            .limit(1)
        if (overlap.length > 0) {
            throw new BadRequestException(
                'You already have a leave request overlapping these dates',
            )
        }

        // Balance check
        const balance = await this.getBalance(employeeId, dto.leaveTypeId)
        if (balance < days) {
            throw new BadRequestException(
                `Insufficient leave balance. Available: ${balance.toFixed(2)} days, requested: ${days} days`,
            )
        }

        // Resolve approver
        const approverUserId = await this.resolveApproverUserId(employeeId)

        return this.db.withTransaction(async (tx) => {
            const [request] = await tx
                .insert(leaveRequests)
                .values({
                    employeeId,
                    leaveTypeId: dto.leaveTypeId,
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    startDayType: dto.startDayType,
                    endDayType: dto.endDayType,
                    days: days.toString(),
                    notes: dto.notes ?? null,
                    status: 'PENDING',
                })
                .returning()

            if (approverUserId) {
                await tx.insert(leaveRequestApprovals).values({
                    leaveRequestId: request.id,
                    approverUserId,
                    level: 1,
                    status: 'PENDING',
                })
            }

            return request
        })
    }

    /**
     * Cancel own leave request.
     * PENDING → CANCELLED (no ledger impact)
     * APPROVED → CANCELLED (restore balance via ADJUSTMENT)
     */
    async cancel(employeeId: string, requestId: string) {
        const [request] = await this.db.db
            .select()
            .from(leaveRequests)
            .where(
                and(
                    eq(leaveRequests.id, requestId),
                    eq(leaveRequests.employeeId, employeeId),
                ),
            )
            .limit(1)

        if (!request) {
            throw new NotFoundException('Leave request not found')
        }
        if (request.status === 'CANCELLED') {
            throw new BadRequestException('Request is already cancelled')
        }
        if (request.status === 'REJECTED') {
            throw new BadRequestException('Cannot cancel a rejected request')
        }

        return this.db.withTransaction(async (tx) => {
            // If previously APPROVED, restore balance
            if (request.status === 'APPROVED') {
                const currentBalance = await this.getBalance(
                    employeeId,
                    request.leaveTypeId,
                )
                const restoreAmount = parseFloat(request.days as unknown as string)
                await tx.insert(leaveLedger).values({
                    employeeId,
                    leaveTypeId: request.leaveTypeId,
                    entryType: 'ADJUSTMENT',
                    amount: restoreAmount.toString(),
                    balance: (currentBalance + restoreAmount).toString(),
                    referenceLeaveRequestId: request.id,
                })
            }

            // Cancel approval row
            await tx
                .update(leaveRequestApprovals)
                .set({ status: 'REJECTED', actedAt: new Date(), remarks: 'Cancelled by employee' })
                .where(
                    and(
                        eq(leaveRequestApprovals.leaveRequestId, requestId),
                        eq(leaveRequestApprovals.status, 'PENDING'),
                    ),
                )

            const [updated] = await tx
                .update(leaveRequests)
                .set({ status: 'CANCELLED', updatedAt: new Date() })
                .where(eq(leaveRequests.id, requestId))
                .returning()

            return updated
        })
    }

    /**
     * Get pending requests for approval — for HR_ADMIN / MANAGER users.
     */
    async getPendingForApproval(userId: string, filter: LeaveRequestFilterDto = {}) {
        const page = Number(filter.page ?? 1)
        const limit = Number(filter.limit ?? 10)
        const offset = (page - 1) * limit

        // Internal user lookup for structural flags
        const user = await this.usersService.getUserFullProfile(userId);
        if (!user) return { items: [], total: 0, page, limit };

        const isPowerUser = user.roles.includes('ADMIN') || user.roles.includes('HR_ADMIN');
        const isRootLeader = user.isRootLeader;
        const directIds = user.ledOrgUnitIds;
        const isAnyLead = directIds.length > 0;

        const whereClauses: (SQL | undefined)[] = [
            eq(leaveRequests.status, 'PENDING'),
        ]

        // Never allow self-approval EXCEPT for root leaders
        if (!isRootLeader) {
            whereClauses.push(ne(leaveRequests.employeeId, user.employeeId ?? ''));
        }

        if (!isPowerUser) {
            // Managers/Leads see: 
            // 1. Requests where they are the explicit approver
            // 2. ALL requests from their direct Org Units
            // 3. Only LEADER requests from child Org Units
            if (isAnyLead) {
                const childIds = await this.orgUnitsService.getDescendantOrgUnitIds(directIds);

                const hierarchyConditions: (SQL | undefined)[] = [
                    // Case 1: I am the explicit approver and it's still pending
                    and(
                        eq(leaveRequestApprovals.approverUserId, userId),
                        eq(leaveRequestApprovals.status, 'PENDING')
                    ),
                    // Case 2: It's from my direct team (I see all)
                    inArray(employees.orgUnitId, directIds)
                ];

                if (childIds.length > 0) {
                    const childLeadEmployeeIds = await this.orgUnitsService.getOrgUnitLeaderEmployeeIds(childIds);
                    if (childLeadEmployeeIds.length > 0) {
                        // Case 3: It's from a child team lead
                        hierarchyConditions.push(
                            and(
                                inArray(employees.orgUnitId, childIds),
                                inArray(employees.id, childLeadEmployeeIds)
                            )
                        );
                    }
                }
                whereClauses.push(or(...hierarchyConditions));
            } else {
                // If I'm not a lead of any unit, I only see things assigned to me
                whereClauses.push(and(
                    eq(leaveRequestApprovals.approverUserId, userId),
                    eq(leaveRequestApprovals.status, 'PENDING')
                ));
            }
        }

        if (filter.search) {
            const search = `%${filter.search}%`
            whereClauses.push(
                or(
                    ilike(employees.firstName, search),
                    ilike(employees.lastName, search),
                ),
            )
        }

        const [countResult] = await this.db.db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(leaveRequests)
            .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
            .leftJoin(
                leaveRequestApprovals,
                eq(leaveRequestApprovals.leaveRequestId, leaveRequests.id),
            )
            .where(and(...whereClauses))

        const approvalJoinCondition = [
            eq(leaveRequestApprovals.leaveRequestId, leaveRequests.id),
        ]

        const rows = await this.db.db
            .select({
                id: leaveRequests.id,
                leaveTypeId: leaveRequests.leaveTypeId,
                leaveTypeName: leaveTypes.name,
                startDate: leaveRequests.startDate,
                endDate: leaveRequests.endDate,
                startDayType: leaveRequests.startDayType,
                endDayType: leaveRequests.endDayType,
                days: leaveRequests.days,
                notes: leaveRequests.notes,
                status: leaveRequests.status,
                createdAt: leaveRequests.createdAt,
                employeeId: leaveRequests.employeeId,
                employeeFirstName: employees.firstName,
                employeeLastName: employees.lastName,
                approvalId: leaveRequestApprovals.id,
                approvalStatus: leaveRequestApprovals.status,
                approvalRemarks: leaveRequestApprovals.remarks,
                approvalActedAt: leaveRequestApprovals.actedAt,
            })
            .from(leaveRequests)
            .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
            .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
            .leftJoin(
                leaveRequestApprovals,
                and(...approvalJoinCondition),
            )
            .where(and(...whereClauses))
            .orderBy(desc(leaveRequests.createdAt))
            .limit(limit)
            .offset(offset)

        return {
            items: await Promise.all(rows.map(async (r) => ({
                ...r,
                days: parseFloat(r.days as unknown as string),
                currentBalance: await this.getBalance(r.employeeId, r.leaveTypeId),
            }))),
            total: countResult?.count ?? 0,
            page,
            limit,
        }
    }

    /**
     * Get all requests (past and pending) for approval — for HR_ADMIN / MANAGER users.
     * Includes those already acted upon by this user.
     */
    async getTeamHistory(userId: string, filter: LeaveRequestFilterDto = {}) {
        const page = Number(filter.page ?? 1)
        const limit = Number(filter.limit ?? 10)
        const offset = (page - 1) * limit

        // Internal user lookup for structural flags
        const user = await this.usersService.getUserFullProfile(userId);
        if (!user) return { items: [], total: 0, page, limit };

        const isPowerUser = user.roles.includes('ADMIN') || user.roles.includes('HR_ADMIN');
        const isRootLeader = user.isRootLeader;
        const directIds = user.ledOrgUnitIds;
        const isAnyLead = directIds.length > 0;

        const whereClauses: (SQL | undefined)[] = []

        if (!isRootLeader) {
            whereClauses.push(ne(leaveRequests.employeeId, user.employeeId ?? ''));
        }

        if (!isPowerUser) {
            // Managers/Leads see: 
            // 1. Requests where they are the explicit approver
            // 2. ALL requests from their direct Org Units
            // 3. Only LEADER requests from child Org Units
            if (isAnyLead) {
                const childIds = await this.orgUnitsService.getDescendantOrgUnitIds(directIds);

                const hierarchyConditions: (SQL | undefined)[] = [
                    // Case 1: I am the explicit approver and it's still pending
                    and(
                        eq(leaveRequestApprovals.approverUserId, userId),
                        eq(leaveRequestApprovals.status, 'PENDING')
                    ),
                    // Case 2: It's from my direct team (I see all)
                    inArray(employees.orgUnitId, directIds)
                ];

                if (childIds.length > 0) {
                    const childLeadEmployeeIds = await this.orgUnitsService.getOrgUnitLeaderEmployeeIds(childIds);

                    if (childLeadEmployeeIds.length > 0) {
                        // Case 3: It's from a child team lead
                        hierarchyConditions.push(
                            and(
                                inArray(employees.orgUnitId, childIds),
                                inArray(employees.id, childLeadEmployeeIds)
                            )
                        );
                    }
                }
                whereClauses.push(or(...hierarchyConditions));
            } else {
                // If I'm not a lead of any unit, I only see things assigned to me
                whereClauses.push(and(
                    eq(leaveRequestApprovals.approverUserId, userId),
                    eq(leaveRequestApprovals.status, 'PENDING')
                ));
            }
        }

        if (filter.search) {
            const search = `%${filter.search}%`
            whereClauses.push(
                or(
                    ilike(employees.firstName, search),
                    ilike(employees.lastName, search),
                ),
            )
        }

        const [countResult] = await this.db.db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(leaveRequests)
            .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
            .leftJoin(
                leaveRequestApprovals,
                eq(leaveRequestApprovals.leaveRequestId, leaveRequests.id),
            )
            .where(and(...whereClauses))

        const approvalJoinCondition = [
            eq(leaveRequestApprovals.leaveRequestId, leaveRequests.id),
        ]

        const rows = await this.db.db
            .select({
                id: leaveRequests.id,
                leaveTypeId: leaveRequests.leaveTypeId,
                leaveTypeName: leaveTypes.name,
                startDate: leaveRequests.startDate,
                endDate: leaveRequests.endDate,
                startDayType: leaveRequests.startDayType,
                endDayType: leaveRequests.endDayType,
                days: leaveRequests.days,
                notes: leaveRequests.notes,
                status: leaveRequests.status,
                createdAt: leaveRequests.createdAt,
                employeeId: leaveRequests.employeeId,
                employeeFirstName: employees.firstName,
                employeeLastName: employees.lastName,
                approvalId: leaveRequestApprovals.id,
                approvalStatus: leaveRequestApprovals.status,
                approvalRemarks: leaveRequestApprovals.remarks,
                approvalActedAt: leaveRequestApprovals.actedAt,
            })
            .from(leaveRequests)
            .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
            .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
            .leftJoin(
                leaveRequestApprovals,
                and(...approvalJoinCondition),
            )
            .where(and(...whereClauses))
            .orderBy(desc(leaveRequests.createdAt))
            .limit(limit)
            .offset(offset)

        return {
            items: await Promise.all(rows.map(async (r) => ({
                ...r,
                days: parseFloat(r.days as unknown as string),
                currentBalance: await this.getBalance(r.employeeId, r.leaveTypeId),
            }))),
            total: countResult?.count ?? 0,
            page,
            limit,
        }
    }

    /**
     * Get upcoming approved leaves for all employees whose requests
     * this user can approve — for the approver dashboard widget.
     */
    async getUpcomingTeamLeaves(userId: string) {
        const today = new Date().toISOString().split('T')[0]

        // Get all employee IDs for requests this user is an approver for
        const rows = await this.db.db
            .select({
                id: leaveRequests.id,
                leaveTypeId: leaveRequests.leaveTypeId,
                leaveTypeName: leaveTypes.name,
                startDate: leaveRequests.startDate,
                endDate: leaveRequests.endDate,
                startDayType: leaveRequests.startDayType,
                endDayType: leaveRequests.endDayType,
                days: leaveRequests.days,
                employeeId: leaveRequests.employeeId,
                employeeFirstName: employees.firstName,
                employeeLastName: employees.lastName,
            })
            .from(leaveRequests)
            .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
            .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
            .innerJoin(
                leaveRequestApprovals,
                and(
                    eq(leaveRequestApprovals.leaveRequestId, leaveRequests.id),
                    eq(leaveRequestApprovals.approverUserId, userId),
                ),
            )
            .where(
                and(
                    eq(leaveRequests.status, 'APPROVED'),
                    gte(leaveRequests.endDate, today),
                ),
            )
            .orderBy(leaveRequests.startDate)
            .limit(20)

        return rows.map((r) => ({
            ...r,
            days: parseFloat(r.days as unknown as string),
        }))
    }

    /**
     * My upcoming approved/pending leaves — for the requester dashboard widget.
     */
    async getMyUpcoming(employeeId: string) {
        const today = new Date().toISOString().split('T')[0]

        const rows = await this.db.db
            .select({
                id: leaveRequests.id,
                leaveTypeId: leaveRequests.leaveTypeId,
                leaveTypeName: leaveTypes.name,
                startDate: leaveRequests.startDate,
                endDate: leaveRequests.endDate,
                days: leaveRequests.days,
                status: leaveRequests.status,
            })
            .from(leaveRequests)
            .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
            .where(
                and(
                    eq(leaveRequests.employeeId, employeeId),
                    inArray(leaveRequests.status, ['PENDING', 'APPROVED']),
                    gte(leaveRequests.endDate, today),
                ),
            )
            .orderBy(leaveRequests.startDate)
            .limit(10)

        return rows.map((r) => ({
            ...r,
            days: parseFloat(r.days as unknown as string),
        }))
    }

    /**
     * Approve a leave request. Creates CONSUMPTION ledger entry.
     */
    async approve(userId: string, requestId: string, dto: ActOnLeaveRequestDto) {
        const [approval] = await this.db.db
            .select()
            .from(leaveRequestApprovals)
            .where(
                and(
                    eq(leaveRequestApprovals.leaveRequestId, requestId),
                    eq(leaveRequestApprovals.approverUserId, userId),
                    eq(leaveRequestApprovals.status, 'PENDING'),
                ),
            )
            .limit(1)

        if (!approval) {
            throw new ForbiddenException('No pending approval found for this request')
        }

        const [request] = await this.db.db
            .select()
            .from(leaveRequests)
            .where(and(eq(leaveRequests.id, requestId), eq(leaveRequests.status, 'PENDING')))
            .limit(1)

        if (!request) {
            throw new NotFoundException('Leave request not found or not in PENDING status')
        }

        const days = parseFloat(request.days as unknown as string)
        const currentBalance = await this.getBalance(request.employeeId, request.leaveTypeId)

        return this.db.withTransaction(async (tx) => {
            // Update approval row
            await tx
                .update(leaveRequestApprovals)
                .set({
                    status: 'APPROVED',
                    actedAt: new Date(),
                    remarks: dto.remarks ?? null,
                })
                .where(eq(leaveRequestApprovals.id, approval.id))

            // Consume balance
            await tx.insert(leaveLedger).values({
                employeeId: request.employeeId,
                leaveTypeId: request.leaveTypeId,
                entryType: 'CONSUMPTION',
                amount: (-days).toString(),
                balance: (currentBalance - days).toString(),
                referenceLeaveRequestId: request.id,
            })

            // Update request
            const [updated] = await tx
                .update(leaveRequests)
                .set({
                    status: 'APPROVED',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(leaveRequests.id, requestId))
                .returning()

            return updated
        })
    }

    /**
     * Reject a leave request.
     */
    async reject(userId: string, requestId: string, dto: ActOnLeaveRequestDto) {
        const [approval] = await this.db.db
            .select()
            .from(leaveRequestApprovals)
            .where(
                and(
                    eq(leaveRequestApprovals.leaveRequestId, requestId),
                    eq(leaveRequestApprovals.approverUserId, userId),
                    eq(leaveRequestApprovals.status, 'PENDING'),
                ),
            )
            .limit(1)

        if (!approval) {
            throw new ForbiddenException('No pending approval found for this request')
        }

        return this.db.withTransaction(async (tx) => {
            await tx
                .update(leaveRequestApprovals)
                .set({
                    status: 'REJECTED',
                    actedAt: new Date(),
                    remarks: dto.remarks ?? null,
                })
                .where(eq(leaveRequestApprovals.id, approval.id))

            const [updated] = await tx
                .update(leaveRequests)
                .set({ status: 'REJECTED', updatedAt: new Date() })
                .where(eq(leaveRequests.id, requestId))
                .returning()

            return updated
        })
    }
}

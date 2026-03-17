import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { overtimeRequests, employees } from '@hybrid-hris/db/schema';
import { eq, and, desc, inArray, or, ne, SQL } from 'drizzle-orm';
import { AuditService } from 'src/core/audit/audit.service';
import { CreateOvertimeRequestDto } from './dto/create-overtime-request.dto';
import { OvertimeStatus } from '@hybrid-hris/domain';
import { UsersService } from 'src/identity/users/users.service';
import { OrgUnitsService } from 'src/core/org-units/org-units.service';
import { AttendanceComputeService } from '../attendance-compute/attendance-compute.service';

@Injectable()
export class OvertimeRequestsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
        private readonly usersService: UsersService,
        private readonly orgUnitsService: OrgUnitsService,
        private readonly attendanceComputeService: AttendanceComputeService,
    ) { }

    async createRequest(employeeId: string, dto: CreateOvertimeRequestDto, actorId: string) {
        const [inserted] = await this.db.db.insert(overtimeRequests).values({
            employeeId,
            date: new Date(dto.date),
            hours: dto.hours.toString(),
            type: dto.type,
            reason: dto.reason,
            status: 'PENDING',
        }).returning();

        await this.auditService.log({
            userId: actorId,
            action: 'CREATE',
            entityType: 'OvertimeRequest',
            entityId: inserted.id,
            newValue: inserted,
        });

        return inserted;
    }

    async findAll(filters: { status?: OvertimeStatus; employeeId?: string; userId?: string } = {}) {
        const conditions: (SQL | undefined)[] = [];
        if (filters.status) conditions.push(eq(overtimeRequests.status, filters.status));
        if (filters.employeeId) conditions.push(eq(overtimeRequests.employeeId, filters.employeeId));

        if (filters.userId) {
            const user = await this.usersService.getUserFullProfile(filters.userId);
            if (user) {
                const isPowerUser = user.roles.includes('ADMIN') || user.roles.includes('HR_ADMIN');
                if (!isPowerUser) {
                    const hierarchyConditions: (SQL | undefined)[] = [];

                    // 1. If supervisor, show those they supervise
                    if (user.isSupervisor) {
                        hierarchyConditions.push(eq(employees.supervisorId, user.employeeId!));
                    }

                    // 2. If leader, show direct reports in their org units or children (if applicable)
                    if (user.isOrgLead) {
                        const directIds = user.ledOrgUnitIds;
                        const childIds = await this.orgUnitsService.getDescendantOrgUnitIds(directIds);

                        // Case: Direct Org Units (show all)
                        hierarchyConditions.push(inArray(employees.orgUnitId, directIds));

                        // Case: Child Org Units (show only leaders of those units, similar to leave logic)
                        if (childIds.length > 0) {
                            const childLeadEmployeeIds = await this.orgUnitsService.getOrgUnitLeaderEmployeeIds(childIds);
                            if (childLeadEmployeeIds.length > 0) {
                                hierarchyConditions.push(
                                    and(
                                        inArray(employees.orgUnitId, childIds),
                                        inArray(employees.id, childLeadEmployeeIds)
                                    )
                                );
                            }
                        }
                    }

                    if (hierarchyConditions.length > 0) {
                        conditions.push(or(...hierarchyConditions));
                    } else {
                        // If not a power user and not a supervisor/lead, they see nothing or only their own?
                        // Usually they shouldn't even hit this for 'pending' if it's for approvals.
                        // But let's restrict to 'nothing' or a fake condition to be safe if they aren't authorized to see others.
                        conditions.push(eq(overtimeRequests.id, '00000000-0000-0000-0000-000000000000'));
                    }

                    // Never allow self-approval view for non-root leaders
                    if (!user.isRootLeader && user.employeeId) {
                        conditions.push(ne(overtimeRequests.employeeId, user.employeeId));
                    }
                }
            }
        }

        return this.db.db
            .select({
                request: overtimeRequests,
                employee: {
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    employeeNo: employees.employeeNo
                }
            })
            .from(overtimeRequests)
            .innerJoin(employees, eq(employees.id, overtimeRequests.employeeId))
            .where(and(...conditions))
            .orderBy(desc(overtimeRequests.createdAt));
    }

    async findEmployeeRequests(employeeId: string) {
        return this.db.db
            .select()
            .from(overtimeRequests)
            .where(eq(overtimeRequests.employeeId, employeeId))
            .orderBy(desc(overtimeRequests.date));
    }

    async processRequest(id: string, status: 'APPROVED' | 'REJECTED', approverId: string, rejectionReason?: string, actorId?: string) {
        const [existing] = await this.db.db
            .select()
            .from(overtimeRequests)
            .where(eq(overtimeRequests.id, id))
            .limit(1);

        if (!existing) throw new NotFoundException('Overtime request not found');
        if (existing.status !== 'PENDING') throw new BadRequestException('Only pending requests can be processed');

        const [updated] = await this.db.db
            .update(overtimeRequests)
            .set({
                status,
                approverId,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null,
                approvedAt: status === 'APPROVED' ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(overtimeRequests.id, id))
            .returning();

        if (status === 'APPROVED') {
            await this.attendanceComputeService.computeForEmployeeOnDate(
                updated.employeeId,
                updated.date.toISOString().split('T')[0],
            );
        }

        await this.auditService.log({
            userId: actorId,
            action: 'PROCESS',
            entityType: 'OvertimeRequest',
            entityId: id,
            oldValue: existing,
            newValue: updated,
            metadata: { status, rejectionReason }
        });

        return updated;
    }
}

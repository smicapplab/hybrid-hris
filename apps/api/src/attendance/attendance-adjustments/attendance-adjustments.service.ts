import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { attendanceAdjustments, attendanceLogs, employees, AttendanceAdjustment } from '@hybrid-hris/db/schema';
import { eq, and, inArray, or, SQL, ne, desc } from 'drizzle-orm';
import { UsersService } from 'src/identity/users/users.service';
import { OrgUnitsService } from 'src/core/org-units/org-units.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';

@Injectable()
export class AttendanceAdjustmentsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly usersService: UsersService,
        private readonly orgUnitsService: OrgUnitsService,
    ) { }

    async createRequest(userId: string, employeeId: string, dto: CreateAdjustmentDto): Promise<AttendanceAdjustment> {
        // 1. Check if log is locked (if it exists)
        if (dto.attendanceLogId) {
            const [log] = await this.db.db
                .select({ isLocked: attendanceLogs.isLocked })
                .from(attendanceLogs)
                .where(eq(attendanceLogs.id, dto.attendanceLogId))
                .limit(1);
            if (log?.isLocked) throw new BadRequestException('Attendance for this date is already locked.');
        }

        // 2. Fetch current log state for snapshot (if exists)
        let previousIn: Date | null = null;
        let previousOut: Date | null = null;
        if (dto.attendanceLogId) {
            const [log] = await this.db.db.select().from(attendanceLogs).where(eq(attendanceLogs.id, dto.attendanceLogId)).limit(1);
            previousIn = log?.actualInAt;
            previousOut = log?.actualOutAt;
        }

        // 3. Insert the adjustment request
        const [inserted] = await this.db.db.insert(attendanceAdjustments).values({
            employeeId,
            attendanceLogId: dto.attendanceLogId ?? null,
            workDate: dto.workDate,
            requestedActualInAt: dto.requestedActualInAt ? new Date(dto.requestedActualInAt) : null,
            requestedActualOutAt: dto.requestedActualOutAt ? new Date(dto.requestedActualOutAt) : null,
            previousActualInAt: previousIn,
            previousActualOutAt: previousOut,
            remarks: dto.remarks,
            status: 'PENDING',
            requestedBy: userId,
        }).returning();

        return inserted;
    }

    async updateRequest(userId: string, id: string, dto: Partial<CreateAdjustmentDto & { status: string }>): Promise<AttendanceAdjustment> {
        const [existing] = await this.db.db
            .select()
            .from(attendanceAdjustments)
            .where(eq(attendanceAdjustments.id, id))
            .limit(1);

        if (!existing) throw new NotFoundException('Adjustment request not found');
        if (existing.requestedBy !== userId) throw new ForbiddenException('You can only update your own requests');
        if (existing.status !== 'PENDING') throw new BadRequestException('Only pending requests can be updated');

        // Check if log is locked (if it exists)
        if (existing.attendanceLogId) {
            const [log] = await this.db.db
                .select({ isLocked: attendanceLogs.isLocked })
                .from(attendanceLogs)
                .where(eq(attendanceLogs.id, existing.attendanceLogId))
                .limit(1);
            if (log?.isLocked) throw new BadRequestException('Attendance for this date is already locked.');
        }

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (dto.requestedActualInAt !== undefined) updateData.requestedActualInAt = dto.requestedActualInAt ? new Date(dto.requestedActualInAt) : null;
        if (dto.requestedActualOutAt !== undefined) updateData.requestedActualOutAt = dto.requestedActualOutAt ? new Date(dto.requestedActualOutAt) : null;
        if (dto.remarks !== undefined) updateData.remarks = dto.remarks;
        if (dto.status !== undefined) updateData.status = dto.status;

        const [updated] = await this.db.db
            .update(attendanceAdjustments)
            .set(updateData)
            .where(eq(attendanceAdjustments.id, id))
            .returning();

        return updated;
    }

    async getPendingForApproval(userId: string): Promise<any[]> {
        const user = await this.usersService.getUserFullProfile(userId);
        if (!user) return [];

        const isPowerUser = user.roles.includes('ADMIN') || user.roles.includes('HR_ADMIN');
        const isRootLeader = user.isRootLeader;
        const directIds = user.ledOrgUnitIds;

        const conditions: (SQL | undefined)[] = [
            eq(attendanceAdjustments.status, 'PENDING')
        ];

        if (!isRootLeader) {
            conditions.push(ne(attendanceAdjustments.employeeId, user.employeeId ?? ''));
        }

        if (!isPowerUser) {
            if (directIds.length > 0) {
                const childIds = await this.orgUnitsService.getDescendantOrgUnitIds(directIds);
                const hierarchyConditions: (SQL | undefined)[] = [
                    inArray(employees.orgUnitId, directIds)
                ];

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
                conditions.push(or(...hierarchyConditions));
            } else {
                return [];
            }
        }

        return this.db.db
            .select({
                adjustment: attendanceAdjustments,
                employee: {
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    employeeNo: employees.employeeNo
                }
            })
            .from(attendanceAdjustments)
            .innerJoin(employees, eq(employees.id, attendanceAdjustments.employeeId))
            .where(and(...conditions))
            .orderBy(desc(attendanceAdjustments.createdAt));
    }

    async approve(userId: string, id: string, remarks?: string) {
        const adjustment = await this.getValidatedAuthority(userId, id);

        return this.db.withTransaction(async (tx) => {
            // 1. Update Adjustment Status
            await tx.update(attendanceAdjustments)
                .set({
                    status: 'APPROVED',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    approverRemarks: remarks,
                    updatedAt: new Date(),
                })
                .where(eq(attendanceAdjustments.id, id));

            // 2. Update or Create Attendance Log
            if (adjustment.attendanceLogId) {
                // Correction
                await tx.update(attendanceLogs)
                    .set({
                        actualInAt: adjustment.requestedActualInAt,
                        actualOutAt: adjustment.requestedActualOutAt,
                        updatedAt: new Date(),
                    })
                    .where(eq(attendanceLogs.id, adjustment.attendanceLogId));
            } else {
                // Missing Entry - create new log
                await tx.insert(attendanceLogs).values({
                    employeeId: adjustment.employeeId,
                    workDate: adjustment.workDate,
                    actualInAt: adjustment.requestedActualInAt,
                    actualOutAt: adjustment.requestedActualOutAt,
                    sourceIn: 'API', // Mark as system-generated
                    sourceOut: 'API',
                });
            }

            return { success: true };
        });
    }

    async reject(userId: string, id: string, remarks?: string) {
        await this.getValidatedAuthority(userId, id);

        await this.db.db.update(attendanceAdjustments)
            .set({
                status: 'REJECTED',
                approvedBy: userId,
                approvedAt: new Date(),
                approverRemarks: remarks,
                updatedAt: new Date(),
            })
            .where(eq(attendanceAdjustments.id, id));

        return { success: true };
    }

    private async getValidatedAuthority(userId: string, id: string) {
        const [adjustment] = await this.db.db
            .select()
            .from(attendanceAdjustments)
            .where(and(eq(attendanceAdjustments.id, id), eq(attendanceAdjustments.status, 'PENDING')))
            .limit(1);

        if (!adjustment) throw new NotFoundException('Adjustment request not found');

        const user = await this.usersService.getUserFullProfile(userId);
        if (!user) throw new ForbiddenException();

        const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('HR_ADMIN');
        const isRoot = user.isRootLeader;

        let hasAuthority = isAdmin || isRoot;

        if (!hasAuthority && user.ledOrgUnitIds.length > 0) {
            const childOrgIds = await this.orgUnitsService.getDescendantOrgUnitIds(user.ledOrgUnitIds);
            const allowedOrgIds = [...user.ledOrgUnitIds, ...childOrgIds];
            
            const [reqEmp] = await this.db.db
                .select({ orgUnitId: employees.orgUnitId })
                .from(employees)
                .where(eq(employees.id, adjustment.employeeId))
                .limit(1);
            
            if (reqEmp && allowedOrgIds.includes(reqEmp.orgUnitId)) {
                hasAuthority = true;
            }
        }

        if (!hasAuthority) throw new ForbiddenException('You do not have authority to act on this request');

        return adjustment;
    }
}

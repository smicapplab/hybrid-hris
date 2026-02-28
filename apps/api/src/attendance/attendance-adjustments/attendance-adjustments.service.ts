import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import {
    attendanceAdjustments,
    attendanceLogs,
    AttendanceAdjustment,
} from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import { CreateAttendanceAdjustmentDto } from './dto/create-attendance-adjustment.dto'

@Injectable()
export class AttendanceAdjustmentsService {
    constructor(private readonly db: DatabaseService) { }

    /** Return all adjustments for an employee, newest first. */
    async findAllByEmployee(employeeId: string): Promise<AttendanceAdjustment[]> {
        return this.db.db
            .select()
            .from(attendanceAdjustments)
            .where(eq(attendanceAdjustments.employeeId, employeeId))
            .orderBy(desc(attendanceAdjustments.createdAt))
    }

    /** Return a single adjustment or throw 404. */
    async findById(id: string): Promise<AttendanceAdjustment> {
        const [row] = await this.db.db
            .select()
            .from(attendanceAdjustments)
            .where(eq(attendanceAdjustments.id, id))
            .limit(1)

        if (!row) {
            throw new NotFoundException('Attendance adjustment not found')
        }

        return row
    }

    /**
     * Submit a correction request for a specific attendance log.
     * At least one of requestedActualInAt / requestedActualOutAt must be provided.
     * The partial unique index (status = 'PENDING') prevents duplicate open requests for the same log.
     */
    async request(
        payload: CreateAttendanceAdjustmentDto,
        requestedBy: string,
    ): Promise<AttendanceAdjustment> {
        if (!payload.requestedActualInAt && !payload.requestedActualOutAt) {
            throw new BadRequestException(
                'At least one of requestedActualInAt or requestedActualOutAt is required',
            )
        }

        // Load and validate the target log
        const [log] = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(eq(attendanceLogs.id, payload.attendanceLogId))
            .limit(1)

        if (!log) {
            throw new NotFoundException('Attendance log not found')
        }

        if (log.isLocked) {
            throw new ForbiddenException(
                'Attendance log is locked after payroll close — no further corrections allowed',
            )
        }

        // Check for existing PENDING adjustment (friendly error before hitting the DB unique index)
        const [existingPending] = await this.db.db
            .select({ id: attendanceAdjustments.id })
            .from(attendanceAdjustments)
            .where(
                and(
                    eq(attendanceAdjustments.attendanceLogId, payload.attendanceLogId),
                    eq(attendanceAdjustments.status, 'PENDING'),
                ),
            )
            .limit(1)

        if (existingPending) {
            throw new ConflictException(
                'A pending correction already exists for this attendance log',
            )
        }

        try {
            const [created] = await this.db.db
                .insert(attendanceAdjustments)
                .values({
                    employeeId:           payload.employeeId,
                    attendanceLogId:      payload.attendanceLogId,
                    requestedActualInAt:  payload.requestedActualInAt
                        ? new Date(payload.requestedActualInAt)
                        : null,
                    requestedActualOutAt: payload.requestedActualOutAt
                        ? new Date(payload.requestedActualOutAt)
                        : null,
                    // Snapshot current actual times for audit trail
                    previousActualInAt:  log.actualInAt  ?? null,
                    previousActualOutAt: log.actualOutAt ?? null,
                    reason:      payload.reason ?? null,
                    requestedBy,
                    status: 'PENDING',
                })
                .returning()

            return created
        } catch (err: any) {
            if (err?.code === '23505') {
                throw new ConflictException(
                    'A pending correction already exists for this attendance log',
                )
            }
            throw err
        }
    }

    /**
     * Approve a PENDING adjustment.
     * Mutates the attendance_log row with the requested times, then marks the adjustment APPROVED.
     * Both operations run in a single transaction.
     */
    async approve(id: string, approverId: string): Promise<AttendanceAdjustment> {
        return this.db.withTransaction(async (tx) => {
            const [adjustment] = await tx
                .select()
                .from(attendanceAdjustments)
                .where(eq(attendanceAdjustments.id, id))
                .limit(1)

            if (!adjustment) {
                throw new NotFoundException('Attendance adjustment not found')
            }

            if (adjustment.status !== 'PENDING') {
                throw new BadRequestException(
                    `Cannot approve an adjustment with status '${adjustment.status}'`,
                )
            }

            // Guard: log must still be unlocked at approval time
            const [log] = await tx
                .select({ isLocked: attendanceLogs.isLocked })
                .from(attendanceLogs)
                .where(eq(attendanceLogs.id, adjustment.attendanceLogId))
                .limit(1)

            if (!log) {
                throw new NotFoundException('Attendance log not found')
            }

            if (log.isLocked) {
                throw new ForbiddenException(
                    'Attendance log has been locked — cannot apply correction',
                )
            }

            // Only overwrite fields that were part of the correction request
            const logPatch: Record<string, unknown> = { updatedAt: new Date() }
            if (adjustment.requestedActualInAt)  logPatch.actualInAt  = adjustment.requestedActualInAt
            if (adjustment.requestedActualOutAt) logPatch.actualOutAt = adjustment.requestedActualOutAt

            await tx
                .update(attendanceLogs)
                .set(logPatch)
                .where(eq(attendanceLogs.id, adjustment.attendanceLogId))

            const now = new Date()
            const [updated] = await tx
                .update(attendanceAdjustments)
                .set({
                    status:     'APPROVED',
                    approvedBy: approverId,
                    approvedAt: now,
                    updatedAt:  now,
                })
                .where(eq(attendanceAdjustments.id, id))
                .returning()

            return updated
        })
    }

    /**
     * Reject a PENDING adjustment.
     * Records the reviewer and timestamp for audit purposes.
     */
    async reject(id: string, approverId: string): Promise<AttendanceAdjustment> {
        const adjustment = await this.findById(id)

        if (adjustment.status !== 'PENDING') {
            throw new BadRequestException(
                `Cannot reject an adjustment with status '${adjustment.status}'`,
            )
        }

        const now = new Date()
        const [updated] = await this.db.db
            .update(attendanceAdjustments)
            .set({
                status:     'REJECTED',
                approvedBy: approverId,
                approvedAt: now,
                updatedAt:  now,
            })
            .where(eq(attendanceAdjustments.id, id))
            .returning()

        return updated
    }

    /**
     * Cancel a PENDING adjustment.
     * Typically called by the original requester before it is reviewed.
     */
    async cancel(id: string): Promise<AttendanceAdjustment> {
        const adjustment = await this.findById(id)

        if (adjustment.status !== 'PENDING') {
            throw new BadRequestException(
                `Cannot cancel an adjustment with status '${adjustment.status}'`,
            )
        }

        const [updated] = await this.db.db
            .update(attendanceAdjustments)
            .set({
                status:    'CANCELLED',
                updatedAt: new Date(),
            })
            .where(eq(attendanceAdjustments.id, id))
            .returning()

        return updated
    }
}

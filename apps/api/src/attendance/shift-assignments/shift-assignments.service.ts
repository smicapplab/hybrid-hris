import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { and, eq, lte, inArray } from 'drizzle-orm'
import {
    employeeShiftAssignments,
    shiftTemplates,
    EmployeeShiftAssignment,
} from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto'
import { UpdateShiftAssignmentDto } from './dto/update-shift-assignment.dto'
import { AuditService } from '../../core/audit/audit.service'

/** Maps JS Date.getUTCDay() (0=Sun … 6=Sat) to the snapshot column key. */
const DOW_KEYS: (keyof EmployeeShiftAssignment)[] = [
    'isSun', 'isMon', 'isTue', 'isWed', 'isThu', 'isFri', 'isSat',
]

/** Returns the work-day column key for a YYYY-MM-DD date string (UTC date arithmetic). */
function dowKey(dateStr: string): keyof EmployeeShiftAssignment {
    const [y, mo, d] = dateStr.split('-').map(Number)
    return DOW_KEYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]
}

@Injectable()
export class ShiftAssignmentsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Return the employee's current shift assignment, or null if none exists.
     */
    async findByEmployee(employeeId: string): Promise<EmployeeShiftAssignment | null> {
        const [row] = await this.db.db
            .select()
            .from(employeeShiftAssignments)
            .where(eq(employeeShiftAssignments.employeeId, employeeId))
            .limit(1)

        return row ?? null
    }

    /**
     * Return the employee's shift assignment if it is active for the given work date.
     * "Active" means:
     *   1. An assignment exists with effectiveFrom <= workDate
     *   2. workDate falls on a scheduled work day (isMon–isSun snapshot)
     * Returns null if either condition is not met.
     */
    async findActiveForDate(
        employeeId: string,
        workDate: string,
    ): Promise<EmployeeShiftAssignment | null> {
        const [row] = await this.db.db
            .select()
            .from(employeeShiftAssignments)
            .where(
                and(
                    eq(employeeShiftAssignments.employeeId, employeeId),
                    lte(employeeShiftAssignments.effectiveFrom, workDate),
                ),
            )
            .limit(1)

        if (!row) return null

        // Guard: is this date a scheduled work day for this shift?
        const key = dowKey(workDate)
        if (!row[key]) return null

        return row
    }

    /**
     * Return active shift assignments for multiple employees for the given work date.
     * "Active" means:
     *   1. An assignment exists with effectiveFrom <= workDate
     *   2. workDate falls on a scheduled work day (isMon–isSun snapshot)
     */
    async findActiveForDateByEmployeeIds(
        employeeIds: string[],
        workDate: string,
    ): Promise<EmployeeShiftAssignment[]> {
        if (!employeeIds.length) return []

        const rows = await this.db.db
            .select()
            .from(employeeShiftAssignments)
            .where(
                and(
                    inArray(employeeShiftAssignments.employeeId, employeeIds),
                    lte(employeeShiftAssignments.effectiveFrom, workDate),
                ),
            )

        // Guard: is this date a scheduled work day for this shift?
        const key = dowKey(workDate)
        return rows.filter((row) => row[key])
    }

    /**
     * Assign (or reassign) a shift to an employee.
     *
     * All snapshot fields are copied from the template at assignment time so that
     * future template edits don't affect this employee's historical attendance.
     * Per-employee overrides (e.g., different break time) can be passed via `override`.
     *
     * Uses INSERT … ON CONFLICT DO UPDATE, so the same call handles both the first
     * assignment and any subsequent reassignment.
     */
    async assign(payload: CreateShiftAssignmentDto, actorId: string): Promise<EmployeeShiftAssignment> {
        return this.db.withTransaction(async (tx) => {
            const [template] = await tx
                .select()
                .from(shiftTemplates)
                .where(eq(shiftTemplates.id, payload.shiftTemplateId))
                .limit(1)

            if (!template || template.deletedAt) {
                throw new NotFoundException('Shift template not found')
            }

            if (!template.isActive) {
                throw new BadRequestException('Shift template is not active')
            }

            const ov = payload.override ?? {}
            const values = {
                employeeId:   payload.employeeId,
                shiftTemplateId: template.id,
                startTime:    ov.startTime    ?? template.startTime,
                endTime:      ov.endTime      ?? template.endTime,
                breakMinutes: ov.breakMinutes ?? template.breakMinutes,
                gracePeriodMinutes: ov.gracePeriodMinutes ?? template.gracePeriodMinutes,
                isFlexible:   ov.isFlexible   ?? template.isFlexible,
                isMon: ov.isMon ?? template.isMon,
                isTue: ov.isTue ?? template.isTue,
                isWed: ov.isWed ?? template.isWed,
                isThu: ov.isThu ?? template.isThu,
                isFri: ov.isFri ?? template.isFri,
                isSat: ov.isSat ?? template.isSat,
                isSun: ov.isSun ?? template.isSun,
                effectiveFrom: payload.effectiveFrom,
            }

            // Get existing for audit diff
            const [existing] = await tx
                .select()
                .from(employeeShiftAssignments)
                .where(eq(employeeShiftAssignments.employeeId, payload.employeeId))
                .limit(1);

            const [upserted] = await tx
                .insert(employeeShiftAssignments)
                .values(values)
                .onConflictDoUpdate({
                    target: employeeShiftAssignments.employeeId,
                    set: {
                        shiftTemplateId: values.shiftTemplateId,
                        startTime:    values.startTime,
                        endTime:      values.endTime,
                        breakMinutes: values.breakMinutes,
                        gracePeriodMinutes: values.gracePeriodMinutes,
                        isFlexible:   values.isFlexible,
                        isMon: values.isMon,
                        isTue: values.isTue,
                        isWed: values.isWed,
                        isThu: values.isThu,
                        isFri: values.isFri,
                        isSat: values.isSat,
                        isSun: values.isSun,
                        effectiveFrom: values.effectiveFrom,
                        updatedAt: new Date(),
                    },
                })
                .returning()

            await this.auditService.log({
                userId: actorId,
                action: existing ? 'UPDATE' : 'CREATE',
                entityType: 'ShiftAssignment',
                entityId: upserted.id,
                oldValue: existing,
                newValue: upserted,
            });

            return upserted
        })
    }

    /**
     * Partially patch the employee's current assignment (individual fields only).
     * Use `assign` to swap to a different template entirely.
     */
    async update(employeeId: string, payload: UpdateShiftAssignmentDto, actorId: string): Promise<EmployeeShiftAssignment> {
        const existing = await this.findByEmployee(employeeId)

        if (!existing) {
            throw new NotFoundException('No shift assignment found for this employee')
        }

        const allowedFields: (keyof UpdateShiftAssignmentDto)[] = [
            'effectiveFrom',
            'startTime', 'endTime', 'breakMinutes', 'gracePeriodMinutes', 'isFlexible',
            'isMon', 'isTue', 'isWed', 'isThu', 'isFri', 'isSat', 'isSun',
        ]

        const patch: Partial<EmployeeShiftAssignment> = {}
        for (const field of allowedFields) {
            const value = payload[field]
            if (value !== undefined) {
                patch[field as keyof EmployeeShiftAssignment] = value as never
            }
        }

        if (Object.keys(patch).length === 0) {
            throw new BadRequestException('No updatable fields provided')
        }

        patch.updatedAt = new Date()

        const [updated] = await this.db.db
            .update(employeeShiftAssignments)
            .set(patch)
            .where(eq(employeeShiftAssignments.employeeId, employeeId))
            .returning()

        await this.auditService.log({
            userId: actorId,
            action: 'UPDATE',
            entityType: 'ShiftAssignment',
            entityId: updated.id,
            oldValue: existing,
            newValue: updated,
        });

        return updated
    }
}

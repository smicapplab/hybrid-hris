import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { and, eq, isNull, desc, sql, gte, lte } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import {
    attendanceLogs,
    users,
    employees,
    hrSettings,
    EmployeeShiftAssignment,
    AttendanceLog,
} from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import {
    ATTENDANCE_SOURCES,
    AttendanceSource,
} from '@hybrid-hris/domain'
import { ShiftAssignmentsService } from '../shift-assignments/shift-assignments.service'
import { PendingShiftAssignmentsService } from '../pending-shift-assignments/pending-shift-assignments.service'
import { AttendanceComputeService } from '../attendance-compute/attendance-compute.service'
import { AuditService } from 'src/core/audit/audit.service'

@Injectable()
export class AttendanceEventsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly shiftAssignmentsService: ShiftAssignmentsService,
        private readonly pendingShiftService: PendingShiftAssignmentsService,
        private readonly computeService: AttendanceComputeService,
        private readonly auditService: AuditService,
    ) { }
    
    private async timeInRow(employeeId: string, source: AttendanceSource) {
        if (!ATTENDANCE_SOURCES.includes(source)) {
            throw new BadRequestException('Invalid attendance source')
        }

        const now = new Date()
        const timezone = await this.getEmployeeTimezone(employeeId)
        
        // Auto-apply any pending schedule change whose effective date has arrived
        const dateStr = this.toLocalDateString(now, timezone)
        await this.pendingShiftService.applyPendingForEmployee(employeeId, dateStr)

        const { workDate, shift } = await this.resolveWorkDateForNow(employeeId, now, timezone)

        // Compute scheduled timestamps — null when punching outside any assigned shift (unscheduled/overtime)
        const scheduled = shift
            ? this.computeScheduledTimes(workDate, shift.startTime, shift.endTime, timezone)
            : null
        const scheduledInAt = scheduled?.scheduledInAt ?? null
        const scheduledOutAt = scheduled?.scheduledOutAt ?? null

        // Check if the latest entry is still open — rules guarantee at most one open entry exists,
        // so checking the latest row is sufficient (avoids a full-table filter on actualOutAt)
        const [latestEntry] = await this.db.db
            .select({
                id: attendanceLogs.id,
                workDate: attendanceLogs.workDate,
                actualInAt: attendanceLogs.actualInAt,
                actualOutAt: attendanceLogs.actualOutAt,
            })
            .from(attendanceLogs)
            .where(eq(attendanceLogs.employeeId, employeeId))
            .orderBy(desc(attendanceLogs.createdAt))
            .limit(1)

        if (latestEntry?.actualInAt && !latestEntry.actualOutAt) {
            if (latestEntry.workDate === workDate) {
                throw new BadRequestException('Already timed in for this work date')
            }
            throw new BadRequestException(
                `You have an open entry from ${latestEntry.workDate}. Please time out first.`,
            )
        }

        const [existing] = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    eq(attendanceLogs.workDate, workDate),
                ),
            )
            .limit(1)

        if (existing?.actualInAt) {
            throw new BadRequestException('You have already recorded a Time In for this work date.')
        }

        return this.db.withTransaction(async (tx) => {
            if (existing) {
                // Row was pre-created (e.g., by a scheduler) but has no actualInAt yet
                const [updated] = await tx
                    .update(attendanceLogs)
                    .set({
                        actualInAt: now,
                        sourceIn: source,
                        updatedAt: now,
                    })
                    .where(eq(attendanceLogs.id, existing.id))
                    .returning()

                return updated
            }

            const [created] = await tx
                .insert(attendanceLogs)
                .values({
                    employeeId,
                    workDate,
                    scheduledInAt,
                    scheduledOutAt,
                    actualInAt: now,
                    sourceIn: source,
                })
                .returning()

            return created
        })
    }

    private async timeOutRow(employeeId: string, source: AttendanceSource) {
        if (!ATTENDANCE_SOURCES.includes(source)) {
            throw new BadRequestException('Invalid attendance source')
        }

        const now = new Date()

        // Find any open entry across all dates (handles overnight shifts and forgotten timeouts).
        // Order by createdAt (never null) rather than actualInAt (nullable for pre-created rows).
        const [openRow] = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    isNull(attendanceLogs.actualOutAt),
                ),
            )
            .orderBy(desc(attendanceLogs.createdAt))
            .limit(1)

        if (!openRow || !openRow.actualInAt) {
            throw new BadRequestException('Cannot TIME_OUT without TIME_IN')
        }

        const [updated] = await this.db.db
            .update(attendanceLogs)
            .set({
                actualOutAt: now,
                sourceOut: source,
                updatedAt: now,
            })
            .where(eq(attendanceLogs.id, openRow.id))
            .returning()

        if (updated) {
            await this.computeService.computeForLog(updated.id)
        }

        return updated
    }
    
    private async validatePin(employeeNumber: string, pin: string): Promise<{ userId: string, employeeId: string }> {
        const [row] = await this.db.db
            .select({
                user: users,
                employee: employees,
            })
            .from(users)
            .leftJoin(employees, eq(users.employeeId, employees.id))
            .where(eq(employees.employeeNo, employeeNumber))
            .limit(1)

        const user = row?.user
        const employee = row?.employee

        if (
            !user ||
            !employee ||
            !user.isActive ||
            user.deletedAt ||
            employee.deletedAt ||
            employee.status !== 'ACTIVE'
        ) {
            throw new BadRequestException('Invalid credentials')
        }

        // Check early: if this is a system user without a linked employee, fail fast
        // before spending cycles on bcrypt
        if (!user.employeeId) {
            throw new BadRequestException('Employee not linked')
        }

        if (user.attendancePinLockedUntil && user.attendancePinLockedUntil > new Date()) {
            throw new BadRequestException('PIN temporarily locked')
        }

        if (!user.attendancePinHash) {
            throw new BadRequestException('PIN not set')
        }

        const valid = await bcrypt.compare(pin, user.attendancePinHash)

        if (!valid) {
            const attempts = (user.attendancePinAttempts ?? 0) + 1
            const lock = attempts >= 5

            await this.db.db
                .update(users)
                .set({
                    attendancePinAttempts: attempts,
                    attendancePinLockedUntil: lock
                        ? new Date(Date.now() + 10 * 60 * 1000)
                        : null,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, user.id))

            throw new BadRequestException('Invalid credentials')
        }

        if (user.attendancePinAttempts !== 0 || user.attendancePinLockedUntil) {
            await this.db.db
                .update(users)
                .set({
                    attendancePinAttempts: 0,
                    attendancePinLockedUntil: null,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, user.id))
        }

        return { userId: user.id, employeeId: user.employeeId }
    }

    /* ============================================================
       READ
       ============================================================ */

    async getEmployeePrefix(): Promise<string> {
        const [row] = await this.db.db
            .select({ employeeNoPrefix: hrSettings.employeeNoPrefix })
            .from(hrSettings)
            .limit(1)

        return row?.employeeNoPrefix ?? ''
    }

    async findAllByEmployee(
        employeeId: string,
        options: { from?: string; to?: string; page?: number; limit?: number } = {}
    ) {
        const { from, to, page = 1, limit = 30 } = options
        const offset = (page - 1) * limit

        const whereClauses = [eq(attendanceLogs.employeeId, employeeId)]

        if (from) {
            whereClauses.push(gte(attendanceLogs.workDate, from))
        }
        if (to) {
            whereClauses.push(lte(attendanceLogs.workDate, to))
        }

        const [countResult] = await this.db.db
            .select({ count: sql<number>`cast(count(${attendanceLogs.id}) as int)` })
            .from(attendanceLogs)
            .where(and(...whereClauses))

        const total = countResult?.count ?? 0

        const data = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(and(...whereClauses))
            .orderBy(desc(attendanceLogs.workDate))
            .limit(limit)
            .offset(offset)

        return { data, total }
    }

    async findById(id: string) {
        const [row] = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(eq(attendanceLogs.id, id))
            .limit(1)

        if (!row) {
            throw new NotFoundException('Attendance record not found')
        }

        return row
    }

    async getTodayStatus(employeeId: string) {
        const now = new Date()
        const timezone = await this.getEmployeeTimezone(employeeId)
        const todayWorkDate = this.toLocalDateString(now, timezone)

        // Fetch the last 2 entries to cover today and the previous work day (whenever that was)
        const logs = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(eq(attendanceLogs.employeeId, employeeId))
            .orderBy(desc(attendanceLogs.workDate), desc(attendanceLogs.createdAt))
            .limit(2)

        // If there is an open entry (actualOutAt is null), that is our "today" (active) status
        // regardless of whether its workDate matches today's date (handles overnight shifts)
        const activeLog = logs.find(l => l.actualOutAt === null)
        
        let todayLog: AttendanceLog | null = null
        let lastLog: AttendanceLog | null = null

        if (activeLog) {
            todayLog = activeLog
            lastLog = logs.find(l => l.id !== activeLog.id) ?? null
        } else {
            todayLog = logs.find(l => l.workDate === todayWorkDate) ?? null
            lastLog = logs.find(l => l.id !== todayLog?.id) ?? null
        }

        return {
            today: todayLog,
            last: lastLog,
            serverTime: now.toISOString(),
            timezone
        }
    }

    /* ============================================================
       FLOW 1: AUTHENTICATED USER (JWT)
       ============================================================ */
    async timeInAuthenticated(userId: string, employeeId: string, source: AttendanceSource) {
        const createdLog = await this.timeInRow(employeeId, source);
        await this.auditService.log({
            userId: userId,
            action: 'attendance.time_in',
            entityType: 'attendance_log',
            entityId: createdLog.id,
            newValue: createdLog,
        });
        return createdLog;
    }

    async timeOutAuthenticated(userId: string, employeeId: string, source: AttendanceSource) {
        const updatedLog = await this.timeOutRow(employeeId, source);
        if (updatedLog) { // Only log if a record was actually updated
            await this.auditService.log({
                userId: userId,
                action: 'attendance.time_out',
                entityType: 'attendance_log',
                entityId: updatedLog.id,
                newValue: updatedLog,
            });
        }
        return updatedLog;
    }

    /* ============================================================
       FLOW 2: KIOSK (EMPLOYEE NUMBER + PIN)
       ============================================================ */

    async punchIn(employeeNumber: string, pin: string, source: AttendanceSource) {
        const { userId, employeeId } = await this.validatePin(employeeNumber, pin);
        const createdLog = await this.timeInRow(employeeId, source);
        await this.auditService.log({
            userId: userId,
            action: 'attendance.kiosk_punch_in',
            entityType: 'attendance_log',
            entityId: createdLog.id,
            newValue: createdLog,
        });
        return createdLog;
    }

    async punchOut(employeeNumber: string, pin: string, source: AttendanceSource) {
        const { userId, employeeId } = await this.validatePin(employeeNumber, pin);
        const updatedLog = await this.timeOutRow(employeeId, source);
        if (updatedLog) { // Only log if a record was actually updated
            await this.auditService.log({
                userId: userId,
                action: 'attendance.kiosk_punch_out',
                entityType: 'attendance_log',
                entityId: updatedLog.id,
                newValue: updatedLog,
            });
        }
        return updatedLog;
    }

    /* ============================================================
       CORE DAILY-ROW LOGIC
       ============================================================ */

    /** Convert a UTC Date to a YYYY-MM-DD string in the given IANA timezone. */
    private toLocalDateString(date: Date, timezone: string): string {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date)
    }

    /**
     * Convert a local "YYYY-MM-DD" + "HH:mm" in the given IANA timezone to a UTC Date.
     *
     * Strategy: build a UTC candidate assuming zero offset, then format it back in the
     * target timezone to measure the actual offset, and correct accordingly.
     * This is accurate for any IANA zone including DST transitions.
     */
    private localTimeToUtc(dateStr: string, timeStr: string, timezone: string): Date {
        const [year, month, day] = dateStr.split('-').map(Number)
        const [hours, minutes] = timeStr.split(':').map(Number)

        // Build a UTC candidate as if the timezone offset were zero
        const candidate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))

        // Format the candidate back in the target timezone to read the local representation
        const fmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        })
        const parts = fmt.formatToParts(candidate)
        const get = (type: string) =>
            Number(parts.find((p) => p.type === type)?.value ?? 0)

        const lYear = get('year')
        const lMonth = get('month')
        const lDay = get('day')
        const lHour = get('hour')
        const lMinute = get('minute')

        // offsetMs = candidate(UTC) - localEquivalent(UTC)
        const localEquivalentMs = Date.UTC(lYear, lMonth - 1, lDay, lHour, lMinute, 0)
        const offsetMs = candidate.getTime() - localEquivalentMs

        return new Date(candidate.getTime() + offsetMs)
    }

    /**
     * Compute scheduled in/out UTC timestamps from shift snapshot fields and the resolved workDate.
     *
     * Overnight detection: if endTime < startTime (e.g., 22:00–06:00), the scheduled
     * out timestamp falls on the next calendar day relative to workDate.
     */
    private computeScheduledTimes(
        workDate: string,   // YYYY-MM-DD in the employee's local timezone
        startTime: string,  // HH:mm (24-hour)
        endTime: string,    // HH:mm (24-hour)
        timezone: string,
    ): { scheduledInAt: Date; scheduledOutAt: Date } {
        const scheduledInAt = this.localTimeToUtc(workDate, startTime, timezone)

        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        const isOvernight = eh * 60 + em < sh * 60 + sm

        let outDateStr = workDate
        if (isOvernight) {
            // Advance workDate by one calendar day (pure date arithmetic, no timezone needed)
            const [y, mo, d] = workDate.split('-').map(Number)
            const nextDay = new Date(Date.UTC(y, mo - 1, d + 1))
            outDateStr = nextDay.toISOString().slice(0, 10)
        }

        const scheduledOutAt = this.localTimeToUtc(outDateStr, endTime, timezone)
        return { scheduledInAt, scheduledOutAt }
    }

    /** Resolve the effective timezone for an employee: employee override → hr_settings default → UTC. */
    private async getEmployeeTimezone(employeeId: string): Promise<string> {
        const [row] = await this.db.db
            .select({
                empTimezone: employees.timezone,
                orgTimezone: hrSettings.timezone,
            })
            .from(employees)
            .leftJoin(hrSettings, sql`true`)
            .where(eq(employees.id, employeeId))
            .limit(1)

        const empTz = row?.empTimezone as string | null | undefined
        const orgTz = row?.orgTimezone as string | null | undefined

        return empTz ?? orgTz ?? 'UTC'
    }

    /**
     * Find the work date and active shift for "now".
     * Checks today first, then yesterday to support overnight shifts.
     * Returns both the resolved workDate string and the shift row (to avoid a second query
     * when the caller needs shift snapshot fields for scheduledInAt/scheduledOutAt).
     */
    private async resolveWorkDateForNow(
        employeeId: string,
        now: Date,
        timezone: string,
    ): Promise<{ workDate: string; shift: EmployeeShiftAssignment | null }> {
        const today = this.toLocalDateString(now, timezone)
        const yesterday = this.toLocalDateString(
            new Date(now.getTime() - 24 * 60 * 60 * 1000),
            timezone,
        )

        const shiftToday = await this.shiftAssignmentsService.findActiveForDate(employeeId, today)
        if (shiftToday) return { workDate: today, shift: shiftToday }

        const shiftYesterday = await this.shiftAssignmentsService.findActiveForDate(employeeId, yesterday)
        if (shiftYesterday) return { workDate: yesterday, shift: shiftYesterday }

        // No active shift for today/yesterday — allow as unscheduled/overtime punch.
        // workDate = today, scheduledInAt/Out will be null on the log row.
        return { workDate: today, shift: null }
    }
}

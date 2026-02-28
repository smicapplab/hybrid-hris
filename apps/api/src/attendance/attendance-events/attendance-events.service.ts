import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { and, eq, isNull, desc, sql } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import { attendanceLogs, users, employees, hrSettings } from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import {
    ATTENDANCE_SOURCES,
    AttendanceSource,
} from '@hybrid-hris/domain'
import { ShiftAssignmentsService } from '../shift-assignments/shift-assignments.service'

@Injectable()
export class AttendanceEventsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly shiftAssignmentsService: ShiftAssignmentsService,
    ) { }

    /* ============================================================
       READ
       ============================================================ */

    async findAllByEmployee(employeeId: string) {
        return this.db.db
            .select()
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    isNull(attendanceLogs.deletedAt),
                ),
            )
            .orderBy(desc(attendanceLogs.actualInAt))
    }

    async findById(id: string) {
        const [row] = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(eq(attendanceLogs.id, id))
            .limit(1)

        if (!row || row.deletedAt) {
            throw new NotFoundException('Attendance record not found')
        }

        return row
    }

    /* ============================================================
       FLOW 1: AUTHENTICATED USER (JWT)
       ============================================================ */

    async timeInAuthenticated(employeeId: string, source: AttendanceSource) {
        return this.timeInRow(employeeId, source)
    }

    async timeOutAuthenticated(employeeId: string, source: AttendanceSource) {
        return this.timeOutRow(employeeId, source)
    }

    /* ============================================================
       FLOW 2: KIOSK (EMPLOYEE NUMBER + PIN)
       ============================================================ */

    async punchIn(employeeNumber: string, pin: string, source: AttendanceSource) {
        const employeeId = await this.validatePin(employeeNumber, pin)
        return this.timeInRow(employeeId, source)
    }

    async punchOut(employeeNumber: string, pin: string, source: AttendanceSource) {
        const employeeId = await this.validatePin(employeeNumber, pin)
        return this.timeOutRow(employeeId, source)
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

    /** Resolve the effective timezone for an employee: employee override → hr_settings default → UTC. */
    private async getEmployeeTimezone(employeeId: string): Promise<string> {
        const [row] = await this.db.db
            .select({
                empTimezone: employees.timezone,
                orgTimezone: hrSettings.timezone,
            })
            .from(employees)
            .leftJoin(hrSettings, sql`true`)   // singleton cross-join
            .where(eq(employees.id, employeeId))
            .limit(1)

        return row?.empTimezone ?? row?.orgTimezone ?? 'UTC'
    }

    private async resolveWorkDateForNow(employeeId: string, now: Date, timezone: string): Promise<string> {
        const today = this.toLocalDateString(now, timezone)
        const yesterday = this.toLocalDateString(
            new Date(now.getTime() - 24 * 60 * 60 * 1000),
            timezone,
        )

        const shiftToday = await this.shiftAssignmentsService.findActiveForDate(employeeId, today)
        if (shiftToday) return today

        const shiftYesterday = await this.shiftAssignmentsService.findActiveForDate(employeeId, yesterday)
        if (shiftYesterday) return yesterday

        throw new BadRequestException('No active shift assignment')
    }

    private async timeInRow(employeeId: string, source: AttendanceSource) {
        if (!ATTENDANCE_SOURCES.includes(source)) {
            throw new BadRequestException('Invalid attendance source')
        }

        const now = new Date()
        const timezone = await this.getEmployeeTimezone(employeeId)
        const workDate = await this.resolveWorkDateForNow(employeeId, now, timezone)

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
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    isNull(attendanceLogs.deletedAt),
                ),
            )
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
                    isNull(attendanceLogs.deletedAt),
                ),
            )
            .limit(1)

        return this.db.withTransaction(async (tx) => {
            if (existing) {
                const [updated] = await tx
                    .update(attendanceLogs)
                    .set({
                        actualInAt: now,
                        source,
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
                    actualInAt: now,
                    source,
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

        // Find any open entry across all dates (handles overnight shifts and forgotten timeouts)
        const [openRow] = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    isNull(attendanceLogs.deletedAt),
                    isNull(attendanceLogs.actualOutAt),
                ),
            )
            .orderBy(desc(attendanceLogs.actualInAt))
            .limit(1)

        if (!openRow || !openRow.actualInAt) {
            throw new BadRequestException('Cannot TIME_OUT without TIME_IN')
        }

        const [updated] = await this.db.db
            .update(attendanceLogs)
            .set({
                actualOutAt: now,
                source,
                updatedAt: now,
            })
            .where(eq(attendanceLogs.id, openRow.id))
            .returning()

        return updated
    }

    /* ============================================================
       PIN VALIDATION (KIOSK FLOW)
       ============================================================ */

    private async validatePin(employeeNumber: string, pin: string): Promise<string> {
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

        if (!user.employeeId) {
            throw new BadRequestException('Employee not linked')
        }

        return user.employeeId
    }
}

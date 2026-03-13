import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { HolidaysService } from '../../core/hr-settings/holidays/holidays.service';
import { attendanceLogs, overtimeRequests } from '@hybrid-hris/db/schema';
import { eq, and, sql } from 'drizzle-orm';

@Injectable()
export class AttendanceComputeService {
    private readonly logger = new Logger(AttendanceComputeService.name);

    constructor(
        private readonly db: DatabaseService,
        private readonly holidaysService: HolidaysService,
    ) { }

    /**
     * Computes hours and status for a given attendance log and updates the record.
     * @param logId The ID of the attendance log to compute.
     */
    async computeForLog(logId: string) {
        const [log] = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(eq(attendanceLogs.id, logId))
            .limit(1);

        if (!log || !log.actualInAt || !log.actualOutAt) {
            this.logger.warn(`Cannot compute hours for log ${logId}: actualInAt or actualOutAt is missing`);
            return;
        }

        const actualInAt = new Date(log.actualInAt);
        const actualOutAt = new Date(log.actualOutAt);

        // 1. Calculate totalHours (excluding break if > 5 hours)
        const totalMs = actualOutAt.getTime() - actualInAt.getTime();
        let totalHours = totalMs / (1000 * 60 * 60);

        // Assume 1 hour break if total > 5 hours
        if (totalHours > 5) {
            totalHours -= 1;
        }
        if (totalHours < 0) totalHours = 0;

        // 2. Calculate nightDiffHours (10 PM to 6 AM)
        const nightDiffHours = this.calculateNightDiff(actualInAt, actualOutAt, log.workDate);

        // 3. Check if workDate is a holiday
        const holiday = await this.holidaysService.isHoliday(log.workDate);
        const holidayHours = holiday ? totalHours : 0;

        // 4. Calculate approved overtimeHours for the same date and employee
        // Matching overtimeRequests.date (timestamp) with log.workDate (date string)
        const approvedOT = await this.db.db
            .select()
            .from(overtimeRequests)
            .where(
                and(
                    eq(overtimeRequests.employeeId, log.employeeId),
                    eq(overtimeRequests.status, 'APPROVED'),
                    sql`DATE(${overtimeRequests.date}) = ${log.workDate}`
                )
            );
        
        const overtimeHours = approvedOT.reduce((acc, ot) => acc + Number(ot.hours), 0);

        // 5. Determine status (PRESENT, LATE, UNDERTIME, etc.)
        let status = 'PRESENT';
        if (log.scheduledInAt) {
            const scheduledInAt = new Date(log.scheduledInAt);
            if (actualInAt > scheduledInAt) {
                status = 'LATE';
            }
        }
        
        // Check for UNDERTIME if not already marked LATE (or we could combine them if needed)
        // Here we prioritize LATE, then UNDERTIME.
        if (status === 'PRESENT' && log.scheduledOutAt) {
            const scheduledOutAt = new Date(log.scheduledOutAt);
            if (actualOutAt < scheduledOutAt) {
                status = 'UNDERTIME';
            }
        }

        // 6. Update the attendance_logs table
        await this.db.db
            .update(attendanceLogs)
            .set({
                totalHours: totalHours.toFixed(2),
                nightDiffHours: nightDiffHours.toFixed(2),
                holidayHours: holidayHours.toFixed(2),
                overtimeHours: overtimeHours.toFixed(2),
                status,
                updatedAt: new Date(),
            })
            .where(eq(attendanceLogs.id, logId));

        this.logger.log(`Computed attendance for log ${logId}: ${totalHours.toFixed(2)}h, Status: ${status}`);
    }

    /**
     * Helper to calculate night differential hours (10 PM to 6 AM).
     */
    private calculateNightDiff(actualInAt: Date, actualOutAt: Date, workDate: string): number {
        const createPHDate = (dateStr: string, hour: number) => {
            // Use ISO string with PH offset (+08:00) to ensure correct UTC conversion
            return new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00+08:00`);
        };

        const d = new Date(workDate);
        
        // Previous day for early morning punches (part of a shift that started yesterday)
        const prevD = new Date(d);
        prevD.setDate(d.getDate() - 1);
        const prevDStr = prevD.toISOString().split('T')[0];

        // Next day for shifts ending the next morning
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);
        const nextDStr = nextD.toISOString().split('T')[0];

        // Night shift windows:
        // Window 1: Yesterday 10 PM to Today 6 AM
        // Window 2: Today 10 PM to Tomorrow 6 AM
        const windows = [
            { start: createPHDate(prevDStr, 22), end: createPHDate(workDate, 6) },
            { start: createPHDate(workDate, 22), end: createPHDate(nextDStr, 6) }
        ];

        let totalNightHours = 0;
        for (const window of windows) {
            totalNightHours += this.calculateOverlap(actualInAt, actualOutAt, window.start, window.end);
        }

        return totalNightHours;
    }

    /**
     * Helper to check if a specific time falls within the night shift (10 PM to 6 AM Manila time).
     */
    isNightShift(time: Date): boolean {
        const hour = parseInt(new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            hour12: false,
            timeZone: 'Asia/Manila',
        }).format(time));
        
        return hour >= 22 || hour < 6;
    }

    /**
     * Helper to calculate overlap in hours between two time ranges.
     */
    calculateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): number {
        const start = start1 > start2 ? start1 : start2;
        const end = end1 < end2 ? end1 : end2;

        if (start < end) {
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
        return 0;
    }
}

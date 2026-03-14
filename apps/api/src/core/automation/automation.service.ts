import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { HolidaysService } from '../hr-settings/holidays/holidays.service';
import { LeaveAccrualsService } from '../leave-accruals/leave-accruals.service';
import { attendanceLogs, employees } from '@hybrid-hris/db/schema';
import { and, eq, isNull, notInArray } from 'drizzle-orm';

@Injectable()
export class AutomationService {
    private readonly logger = new Logger(AutomationService.name);

    constructor(
        private readonly db: DatabaseService,
        @Inject(forwardRef(() => HolidaysService)) // WRAP THIS HERE
        private readonly holidaysService: HolidaysService,
        private readonly leaveAccrualsService: LeaveAccrualsService,
    ) { }

    /**
     * Finds all active employees who don't have an attendance log for a given holiday
     * and creates an unworked holiday log for them.
     */
    async processHolidayPay(date: string) {
        const holiday = await this.holidaysService.isHoliday(date);
        if (!holiday) {
            this.logger.log(`Skipping holiday processing: ${date} is not a registered holiday.`);
            return { success: false, message: 'Not a holiday' };
        }

        this.logger.log(`Processing unworked holiday pay for: ${holiday.name} (${date})`);

        // 1. Find employees who ALREADY have a log for this date (they worked or filed something)
        const employeesWithLogs = this.db.db
            .select({ id: attendanceLogs.employeeId })
            .from(attendanceLogs)
            .where(eq(attendanceLogs.workDate, date));

        // 2. Find active employees who are MISSING a log
        const missingEmployees = await this.db.db
            .select({
                id: employees.id,
                firstName: employees.firstName,
                lastName: employees.lastName
            })
            .from(employees)
            .where(
                and(
                    eq(employees.status, 'ACTIVE'),
                    isNull(employees.deletedAt),
                    notInArray(employees.id, employeesWithLogs)
                )
            );

        if (missingEmployees.length === 0) {
            return { success: true, count: 0 };
        }

        // 3. Create unworked holiday logs
        const logsToInsert = missingEmployees.map(emp => ({
            employeeId: emp.id,
            workDate: date,
            status: 'HOLIDAY',
            totalHours: '0',
            holidayHours: '8.00', // Standard 8 hours for unworked regular holiday
            isLocked: false,
        }));

        await this.db.db.insert(attendanceLogs).values(logsToInsert);

        this.logger.log(`Created ${logsToInsert.length} unworked holiday logs for ${date}`);
        return { success: true, count: logsToInsert.length };
    }

    /**
     * Triggers monthly leave accruals.
     */
    async processAccruals() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        this.logger.log(`Triggering leave accruals for ${month}/${year}`);
        return this.leaveAccrualsService.processMonthlyAccruals(year, month);
    }
}

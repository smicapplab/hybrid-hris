import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutomationService } from './automation.service';

@Injectable()
export class AutomationCron {
    private readonly logger = new Logger(AutomationCron.name);

    constructor(private readonly automationService: AutomationService) { }

    /**
     * Runs every day at 00:05 AM.
     * Processes holiday pay for the previous day if it was a holiday.
     */
    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handleDailyJobs() {
        if (process.env.ENABLE_INTERNAL_SCHEDULER !== 'true') {
            return;
        }

        this.logger.log('Running scheduled daily automation jobs...');

        // Process yesterday's holiday pay
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        await this.automationService.processHolidayPay(dateStr);
        await this.automationService.processScheduleChanges();
    }

    /**
     * Runs on the 1st of every month at 01:00 AM.
     */
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async handleMonthlyJobs() {
        if (process.env.ENABLE_INTERNAL_SCHEDULER !== 'true') {
            return;
        }

        this.logger.log('Running scheduled monthly automation jobs...');
        await this.automationService.processAccruals();
    }
}

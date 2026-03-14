import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from 'src/database/database.module';
import { HrSettingsModule } from '../hr-settings/hr-settings.module';
import { LeaveAccrualsModule } from '../leave-accruals/leave-accruals.module';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AutomationCron } from './automation.cron';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        DatabaseModule,
        HrSettingsModule, // For HolidaysService
        LeaveAccrualsModule,
    ],
    providers: [AutomationService, AutomationCron],
    controllers: [AutomationController],
    exports: [AutomationService],
})
export class AutomationModule { }

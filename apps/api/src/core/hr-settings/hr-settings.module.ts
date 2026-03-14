import { Module, forwardRef } from '@nestjs/common';
import { HrSettingsService } from './hr-settings.service';
import { HrSettingsController } from './hr-settings.controller';
import { DatabaseModule } from 'src/database/database.module';
import { HolidaysService } from './holidays/holidays.service';
import { HolidaysController } from './holidays/holidays.controller';
import { AutomationModule } from '../automation/automation.module';

@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => AutomationModule),
    ],
    providers: [HrSettingsService, HolidaysService],
    controllers: [HrSettingsController, HolidaysController],
    exports: [HrSettingsService, HolidaysService],
})
export class HrSettingsModule { }

import { Module } from '@nestjs/common';
import { HrSettingsService } from './hr-settings.service';
import { HrSettingsController } from './hr-settings.controller';
import { DatabaseModule } from 'src/database/database.module';
import { HolidaysService } from './holidays/holidays.service';
import { HolidaysController } from './holidays/holidays.controller';

@Module({
    imports: [DatabaseModule],
    providers: [HrSettingsService, HolidaysService],
    controllers: [HrSettingsController, HolidaysController],
    exports: [HrSettingsService, HolidaysService],
})
export class HrSettingsModule { }

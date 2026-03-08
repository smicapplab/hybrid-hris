import { Module } from '@nestjs/common';
import { HrSettingsService } from './hr-settings.service';
import { HrSettingsController } from './hr-settings.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [HrSettingsService],
    controllers: [HrSettingsController],
    exports: [HrSettingsService],
})
export class HrSettingsModule { }

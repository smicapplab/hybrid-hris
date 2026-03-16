import { Module } from '@nestjs/common';
import { JobLevelsService } from './job-levels.service';
import { JobLevelsController } from './job-levels.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
    imports: [DatabaseModule, AuditModule],
    providers: [JobLevelsService],
    controllers: [JobLevelsController],
    exports: [JobLevelsService],
})
export class JobLevelsModule { }

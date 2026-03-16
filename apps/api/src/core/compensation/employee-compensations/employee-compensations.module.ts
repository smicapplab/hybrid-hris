import { Module } from '@nestjs/common';
import { EmployeeCompensationsService } from './employee-compensations.service';
import { EmployeeCompensationsController } from './employee-compensations.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
    imports: [DatabaseModule, AuditModule],
    providers: [EmployeeCompensationsService],
    controllers: [EmployeeCompensationsController],
    exports: [EmployeeCompensationsService],
})
export class EmployeeCompensationsModule { }

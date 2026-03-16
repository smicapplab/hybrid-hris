import { Module } from '@nestjs/common';
import { PayrollComponentsService } from './payroll-components.service';
import { PayrollComponentsController } from './payroll-components.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
    imports: [DatabaseModule, AuditModule],
    providers: [PayrollComponentsService],
    controllers: [PayrollComponentsController],
    exports: [PayrollComponentsService],
})
export class PayrollComponentsModule { }

import { Module } from '@nestjs/common';
import { JobLevelsModule } from './job-levels/job-levels.module';
import { PayrollComponentsModule } from './payroll-components/payroll-components.module';
import { EmployeeCompensationsModule } from './employee-compensations/employee-compensations.module';
import { CompensationTemplatesModule } from './compensation-templates/compensation-templates.module';

@Module({
    imports: [JobLevelsModule, PayrollComponentsModule, EmployeeCompensationsModule, CompensationTemplatesModule],
    exports: [JobLevelsModule, PayrollComponentsModule, EmployeeCompensationsModule, CompensationTemplatesModule],
})
export class CompensationModule { }

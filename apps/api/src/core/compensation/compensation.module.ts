import { Module } from '@nestjs/common';
import { JobLevelsModule } from './job-levels/job-levels.module';
import { PayrollComponentsModule } from './payroll-components/payroll-components.module';

@Module({
    imports: [JobLevelsModule, PayrollComponentsModule],
    exports: [JobLevelsModule, PayrollComponentsModule],
})
export class CompensationModule { }

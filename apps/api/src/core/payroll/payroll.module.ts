import { Module } from '@nestjs/common';
import { BatchesModule } from './batches/batches.module';
import { PayslipsModule } from './payslips/payslips.module';
import { FinalPayModule } from './final-pay/final-pay.module';
import { ThirteenthMonthModule } from './thirteenth-month/thirteenth-month.module';

@Module({
    imports: [BatchesModule, PayslipsModule, FinalPayModule, ThirteenthMonthModule],
})
export class PayrollModule {}

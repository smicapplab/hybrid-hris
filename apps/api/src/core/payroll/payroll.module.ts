import { Module } from '@nestjs/common';
import { BatchesModule } from './batches/batches.module';
import { PayslipsModule } from './payslips/payslips.module';
import { FinalPayModule } from './final-pay/final-pay.module';

@Module({
    imports: [BatchesModule, PayslipsModule, FinalPayModule],
})
export class PayrollModule {}

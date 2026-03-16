import { Module } from '@nestjs/common';
import { FinalPayService } from './final-pay.service';
import { FinalPayController } from './final-pay.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [FinalPayController],
    providers: [FinalPayService],
    exports: [FinalPayService],
})
export class FinalPayModule {}

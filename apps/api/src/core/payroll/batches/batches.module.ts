import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PayslipsModule } from '../payslips/payslips.module';

@Module({
    imports: [DatabaseModule, PayslipsModule],
    controllers: [BatchesController],
    providers: [BatchesService],
    exports: [BatchesService],
})
export class BatchesModule {}

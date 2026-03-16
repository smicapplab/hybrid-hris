import { Module } from '@nestjs/common';
import { ThirteenthMonthService } from './thirteenth-month.service';
import { ThirteenthMonthController } from './thirteenth-month.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [ThirteenthMonthService],
    controllers: [ThirteenthMonthController],
    exports: [ThirteenthMonthService],
})
export class ThirteenthMonthModule {}

import { Module } from '@nestjs/common';
import { LeaveAccrualsService } from './leave-accruals.service';
import { LeaveAccrualsController } from './leave-accruals.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [LeaveAccrualsService],
    controllers: [LeaveAccrualsController],
    exports: [LeaveAccrualsService],
})
export class LeaveAccrualsModule { }

import { Module } from '@nestjs/common';
import { PayslipsService } from './payslips.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [PayslipsService],
    exports: [PayslipsService],
})
export class PayslipsModule {}

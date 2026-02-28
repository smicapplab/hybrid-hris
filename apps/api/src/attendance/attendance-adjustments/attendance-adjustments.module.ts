import { Module } from '@nestjs/common';
import { AttendanceAdjustmentsController } from './attendance-adjustments.controller';
import { AttendanceAdjustmentsService } from './attendance-adjustments.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AttendanceAdjustmentsController],
  providers: [AttendanceAdjustmentsService]
})
export class AttendanceAdjustmentsModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AttendanceComputeService } from './attendance-compute.service';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [DatabaseModule, CoreModule],
  providers: [AttendanceComputeService],
  exports: [AttendanceComputeService],
})
export class AttendanceComputeModule {}

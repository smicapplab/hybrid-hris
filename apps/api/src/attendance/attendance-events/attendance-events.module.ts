import { Module } from '@nestjs/common'
import { DatabaseModule } from 'src/database/database.module'
import { ShiftAssignmentsModule } from '../shift-assignments/shift-assignments.module'
import { PendingShiftAssignmentsModule } from '../pending-shift-assignments/pending-shift-assignments.module'
import { AttendanceEventsService } from './attendance-events.service'
import { AttendanceEventsController } from './attendance-events.controller'
import { AttendanceComputeModule } from '../attendance-compute/attendance-compute.module'
import { CoreModule } from '../../core/core.module'

@Module({
  imports: [
    DatabaseModule, 
    ShiftAssignmentsModule, 
    PendingShiftAssignmentsModule,
    CoreModule,
    AttendanceComputeModule,
  ],
  providers: [AttendanceEventsService],
  controllers: [AttendanceEventsController],
  exports: [AttendanceEventsService],
})
export class AttendanceEventsModule {}

import { Module } from "@nestjs/common";
import { AttendanceEventsModule } from './attendance-events/attendance-events.module';
import { ShiftTemplatesModule } from './shift-templates/shift-templates.module';
import { ShiftAssignmentsModule } from './shift-assignments/shift-assignments.module';
import { AttendanceAdjustmentsModule } from './attendance-adjustments/attendance-adjustments.module';
import { AttendanceComputeService } from './attendance-compute/attendance-compute.service';

@Module({
    imports: [
        ShiftAssignmentsModule,
        ShiftTemplatesModule,
        AttendanceAdjustmentsModule,
        AttendanceEventsModule,
    ],
    providers: [AttendanceComputeService],
    exports: [
        AttendanceEventsModule,
        ShiftTemplatesModule,
        ShiftAssignmentsModule,
        AttendanceAdjustmentsModule,
        AttendanceComputeService,
    ],
})

export class AttendanceModule { }
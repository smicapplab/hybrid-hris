import { Module } from "@nestjs/common";
import { AttendanceEventsModule } from './attendance-events/attendance-events.module';
import { ShiftTemplatesModule } from './shift-templates/shift-templates.module';
import { ShiftAssignmentsModule } from './shift-assignments/shift-assignments.module';
import { AttendanceAdjustmentsModule } from './attendance-adjustments/attendance-adjustments.module';
import { OvertimeRequestsModule } from './overtime-requests/overtime-requests.module';
import { AttendanceComputeModule } from './attendance-compute/attendance-compute.module';
import { CoreModule } from '../core/core.module';

@Module({
    imports: [
        CoreModule,
        ShiftAssignmentsModule,
        ShiftTemplatesModule,
        AttendanceAdjustmentsModule,
        OvertimeRequestsModule,
        AttendanceEventsModule,
        AttendanceComputeModule,
    ],
    providers: [],
    exports: [
        AttendanceEventsModule,
        ShiftTemplatesModule,
        ShiftAssignmentsModule,
        AttendanceAdjustmentsModule,
        OvertimeRequestsModule,
        AttendanceComputeModule,
    ],
})

export class AttendanceModule { }

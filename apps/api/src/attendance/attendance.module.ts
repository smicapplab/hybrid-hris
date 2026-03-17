import { Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { AttendanceEventsModule } from './attendance-events/attendance-events.module';
import { ShiftTemplatesModule } from './shift-templates/shift-templates.module';
import { ShiftAssignmentsModule } from './shift-assignments/shift-assignments.module';
import { PendingShiftAssignmentsModule } from './pending-shift-assignments/pending-shift-assignments.module';
import { AttendanceAdjustmentsModule } from './attendance-adjustments/attendance-adjustments.module';
import { OvertimeRequestsModule } from './overtime-requests/overtime-requests.module';
import { AttendanceComputeModule } from './attendance-compute/attendance-compute.module';
import { PresenceModule } from "./presence/presence.module";

@Module({
    imports: [
        CoreModule,
        PresenceModule,
        ShiftAssignmentsModule,
        ShiftTemplatesModule,
        PendingShiftAssignmentsModule,
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
        PendingShiftAssignmentsModule,
        AttendanceAdjustmentsModule,
        OvertimeRequestsModule,
        AttendanceComputeModule,
        PresenceModule,
    ],
})

export class AttendanceModule { }

import { Module } from '@nestjs/common';
import { PendingShiftAssignmentsController } from './pending-shift-assignments.controller';
import { PendingShiftAssignmentsService } from './pending-shift-assignments.service';
import { AuditModule } from '../../core/audit/audit.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule, AuditModule],
    controllers: [PendingShiftAssignmentsController],
    providers: [PendingShiftAssignmentsService],
    exports: [PendingShiftAssignmentsService],
})
export class PendingShiftAssignmentsModule { }

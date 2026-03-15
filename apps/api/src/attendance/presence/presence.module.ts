import { Module } from '@nestjs/common';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';
import { DatabaseModule } from 'src/database/database.module';
import { CoreModule } from 'src/core/core.module';
import { ShiftAssignmentsModule } from '../shift-assignments/shift-assignments.module';

@Module({
    imports: [DatabaseModule, CoreModule, ShiftAssignmentsModule],
    controllers: [PresenceController],
    providers: [PresenceService],
    exports: [PresenceService]
})
export class PresenceModule { }

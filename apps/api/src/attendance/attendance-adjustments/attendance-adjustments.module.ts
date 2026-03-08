import { Module } from '@nestjs/common';
import { AttendanceAdjustmentsController } from './attendance-adjustments.controller';
import { AttendanceAdjustmentsService } from './attendance-adjustments.service';
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/identity/users/users.module';
import { OrgUnitsModule } from 'src/core/org-units/org-units.module';

@Module({
  imports: [DatabaseModule, UsersModule, OrgUnitsModule],
  controllers: [AttendanceAdjustmentsController],
  providers: [AttendanceAdjustmentsService]
})
export class AttendanceAdjustmentsModule {}

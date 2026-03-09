import { Module } from '@nestjs/common';
import { ManpowerService } from './manpower.service';
import { ManpowerController } from './manpower.controller';
import { OrgUnitsModule } from '../org-units/org-units.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule, OrgUnitsModule],
  providers: [ManpowerService],
  controllers: [ManpowerController],
  exports: [ManpowerService],
})
export class ManpowerModule {}

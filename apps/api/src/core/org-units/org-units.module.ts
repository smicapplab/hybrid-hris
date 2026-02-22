import { Module } from '@nestjs/common';
import { OrgUnitsService } from './org-units.service';
import { OrgUnitsController } from './org-units.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [OrgUnitsService],
  controllers: [OrgUnitsController],
  exports: [OrgUnitsService],
})
export class OrgUnitsModule { }
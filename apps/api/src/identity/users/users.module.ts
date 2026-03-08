import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';
import { OrgUnitsModule } from 'src/core/org-units/org-units.module';

@Module({
  imports: [DatabaseModule, OrgUnitsModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }

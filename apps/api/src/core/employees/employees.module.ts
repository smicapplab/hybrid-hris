import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/identity/users/users.module';
import { RolesModule } from 'src/identity/roles/roles.module';
import { OrgUnitsModule } from '../org-units/org-units.module';
import { PositionsModule } from '../positions/positions.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    RolesModule,
    OrgUnitsModule,
    PositionsModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeesRepository],
  exports: [EmployeesService],
})
export class EmployeesModule { }

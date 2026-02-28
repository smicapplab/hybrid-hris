import { Module } from "@nestjs/common";
import { OrgUnitsModule } from "./org-units/org-units.module";
import { PositionsModule } from './positions/positions.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
    imports: [OrgUnitsModule, PositionsModule, EmployeesModule],
    exports: [OrgUnitsModule, PositionsModule, EmployeesModule],
})

export class CoreModule { }
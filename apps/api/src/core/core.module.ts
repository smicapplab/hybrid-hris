import { Module } from "@nestjs/common";
import { OrgUnitsModule } from "./org-units/org-units.module";
import { PositionsModule } from './positions/positions.module';
import { EmployeesModule } from './employees/employees.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { LeavePoliciesModule } from './leave-policies/leave-policies.module';

@Module({
    imports: [OrgUnitsModule, PositionsModule, EmployeesModule, LeaveTypesModule, LeavePoliciesModule],
    exports: [OrgUnitsModule, PositionsModule, EmployeesModule, LeaveTypesModule, LeavePoliciesModule],
})

export class CoreModule { }
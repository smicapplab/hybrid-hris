import { Module } from "@nestjs/common";
import { OrgUnitsModule } from "./org-units/org-units.module";
import { PositionsModule } from './positions/positions.module';
import { EmployeesModule } from './employees/employees.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { LeavePoliciesModule } from './leave-policies/leave-policies.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';

@Module({
    imports: [OrgUnitsModule, PositionsModule, EmployeesModule, LeaveTypesModule, LeavePoliciesModule, LeaveRequestsModule],
    exports: [OrgUnitsModule, PositionsModule, EmployeesModule, LeaveTypesModule, LeavePoliciesModule, LeaveRequestsModule],
})

export class CoreModule { }
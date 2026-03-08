import { Module } from "@nestjs/common";
import { OrgUnitsModule } from "./org-units/org-units.module";
import { PositionsModule } from './positions/positions.module';
import { EmployeesModule } from './employees/employees.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { LeavePoliciesModule } from './leave-policies/leave-policies.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { LeaveAccrualsModule } from './leave-accruals/leave-accruals.module';
import { ExpensesModule } from './expenses/expenses.module';
import { HrSettingsModule } from './hr-settings/hr-settings.module';

@Module({
    imports: [OrgUnitsModule, PositionsModule, EmployeesModule, LeaveTypesModule, LeavePoliciesModule, LeaveRequestsModule, LeaveAccrualsModule, ExpensesModule, HrSettingsModule],
    exports: [OrgUnitsModule, PositionsModule, EmployeesModule, LeaveTypesModule, LeavePoliciesModule, LeaveRequestsModule, LeaveAccrualsModule, ExpensesModule, HrSettingsModule],
})

export class CoreModule { }
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
import { ManpowerModule } from './manpower/manpower.module';
import { SkillsModule } from "./skills/skills.module";
import { TrainingModule } from "./training/training.module";
import { AutomationModule } from "./automation/automation.module";

@Module({
    imports: [
        OrgUnitsModule,
        PositionsModule,
        EmployeesModule,
        LeaveTypesModule,
        LeavePoliciesModule,
        LeaveRequestsModule,
        LeaveAccrualsModule,
        ExpensesModule,
        HrSettingsModule,
        ManpowerModule,
        SkillsModule,
        TrainingModule,
        AutomationModule,
    ],
    exports: [
        OrgUnitsModule,
        PositionsModule,
        EmployeesModule,
        LeaveTypesModule,
        LeavePoliciesModule,
        LeaveRequestsModule,
        LeaveAccrualsModule,
        ExpensesModule,
        HrSettingsModule,
        ManpowerModule,
        SkillsModule,
        TrainingModule,
        AutomationModule,
    ],
})

export class CoreModule { }

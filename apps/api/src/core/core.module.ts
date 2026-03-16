import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { OrgUnitsModule } from './org-units/org-units.module';
import { PositionsModule } from './positions/positions.module';
import { ManpowerModule } from './manpower/manpower.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { LeavePoliciesModule } from './leave-policies/leave-policies.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { LeaveAccrualsModule } from './leave-accruals/leave-accruals.module';
import { HrSettingsModule } from './hr-settings/hr-settings.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SkillsModule } from './skills/skills.module';
import { TrainingModule } from './training/training.module';
import { AutomationModule } from './automation/automation.module';
import { PendingShiftAssignmentsModule } from '../attendance/pending-shift-assignments/pending-shift-assignments.module';
import { CompensationModule } from './compensation/compensation.module';

@Module({
  imports: [
    EmployeesModule,
    OrgUnitsModule,
    PositionsModule,
    ManpowerModule,
    LeaveTypesModule,
    LeavePoliciesModule,
    LeaveRequestsModule,
    LeaveAccrualsModule,
    HrSettingsModule,
    ExpensesModule,
    SkillsModule,
    TrainingModule,
    AutomationModule,
    PendingShiftAssignmentsModule,
    CompensationModule,
  ],
  providers: [],
  exports: [
    EmployeesModule,
    OrgUnitsModule,
    PositionsModule,
    ManpowerModule,
    LeaveTypesModule,
    LeavePoliciesModule,
    LeaveRequestsModule,
    LeaveAccrualsModule,
    HrSettingsModule,
    ExpensesModule,
    SkillsModule,
    TrainingModule,
    AutomationModule,
    CompensationModule,
  ]
})
export class CoreModule { }

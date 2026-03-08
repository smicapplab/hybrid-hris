import type { InferSelectModel } from 'drizzle-orm'
import { orgUnits } from './schema/org-units'
import { positions } from './schema/positions'
import {
    employeeIdentifiers,
    employeeProfiles,
    employees,
    expenseCategories,
    budgetPeriods,
    orgUnitBudgets,
    expenseClaims,
    expenseClaimApprovals,
    budgetLedger,
    expenseReceipts,
    attendanceAdjustments,
} from './schema'

export type OrgUnit = InferSelectModel<typeof orgUnits>
export type Position = InferSelectModel<typeof positions>
export type Employee = InferSelectModel<typeof employees>
export type EmployeeIdentifier = InferSelectModel<typeof employeeIdentifiers>
export type EmployeeProfile = InferSelectModel<typeof employeeProfiles>

export type ExpenseCategory = InferSelectModel<typeof expenseCategories>
export type BudgetPeriod = InferSelectModel<typeof budgetPeriods>
export type OrgUnitBudget = InferSelectModel<typeof orgUnitBudgets>
export type ExpenseClaim = InferSelectModel<typeof expenseClaims>
export type ExpenseClaimApproval = InferSelectModel<typeof expenseClaimApprovals>
export type BudgetLedger = InferSelectModel<typeof budgetLedger>
export type ExpenseReceipt = InferSelectModel<typeof expenseReceipts>
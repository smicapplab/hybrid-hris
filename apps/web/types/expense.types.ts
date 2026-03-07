export type BudgetPeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export type ExpenseClaimStatus = 
    | 'DRAFT'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'REIMBURSED';

export type ExpenseCategory = {
    id: string;
    code: string;
    name: string;
    description: string | null;
};

export type BudgetPeriod = {
    id: string;
    code: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    periodType: BudgetPeriodType;
};

export type ExpenseClaim = {
    id: string;
    employeeId: string;
    orgUnitId: string;
    expenseCategoryId: string;
    budgetPeriodId: string;
    amount: string;
    expenseDate: string;
    description: string;
    status: ExpenseClaimStatus;
    submittedAt: string | null;
    approvedAt: string | null;
    reimbursedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OrgUnitBudget = {
    id: string;
    orgUnitId: string;
    budgetPeriodId: string;
    expenseCategoryId: string;
    amountAllocated: string;
};

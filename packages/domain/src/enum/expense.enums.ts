export enum BudgetPeriodType {
    MONTHLY = 'MONTHLY',
    QUARTERLY = 'QUARTERLY',
    ANNUAL = 'ANNUAL',
}

export enum ExpenseClaimStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    REIMBURSED = 'REIMBURSED',
}

export enum ExpenseApprovalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum BudgetLedgerEntryType {
    ALLOCATION = 'ALLOCATION',
    CONSUMPTION = 'CONSUMPTION',
    ADJUSTMENT = 'ADJUSTMENT',
    REVERSAL = 'REVERSAL',
    RESERVATION = 'RESERVATION',
    RELEASE = 'RELEASE',
}

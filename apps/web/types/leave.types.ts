export type LeaveType = {
    id: string
    code: string
    name: string
    description: string | null
    isAccrualBased: boolean
    isPaid: boolean
    accrualRatePerMonth: string | null
    maxCarryOver: string | null
    deletedAt: string | null
    createdAt: string
    updatedAt: string
}

export type LeavePolicy = {
    id: string
    code: string
    name: string
    description: string | null
    isActive: boolean
    isDefault: boolean
    effectiveFrom: string
    effectiveTo: string | null
    createdAt: string
    updatedAt: string
}

export type LeavePolicyRule = {
    id: string
    policyId: string
    leaveTypeId: string
    leaveTypeName: string | null
    leaveTypeCode: string | null
    accrualMethod: 'MONTHLY' | 'ANNUAL_GRANT' | 'NONE'
    accrualRatePerMonth: string | null
    annualGrantAmount: string | null
    maxBalance: string | null
    maxCarryOver: string | null
    allowNegativeBalance: boolean
    isRegularOnly: boolean
    createdAt: string
}

export type LeavePolicyWithRules = LeavePolicy & {
    rules: LeavePolicyRule[]
}

export const EMPLOYEE_STATUSES = [
    'ACTIVE',
    'PROBATION',
    'SUSPENDED',
    'RESIGNED',
    'TERMINATED',
] as const

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export function isEmployeeStatus(v: string): v is EmployeeStatus {
    return EMPLOYEE_STATUSES.includes(v as EmployeeStatus)
}

export const EMPLOYMENT_TYPES = [
    'REGULAR',
    'PROBATIONARY',
    'CONTRACTUAL',
    'CONSULTANT',
    'INTERN',
] as const

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export function isEmploymentType(v: string): v is EmploymentType {
    return EMPLOYMENT_TYPES.includes(v as EmploymentType)
}

export const GENDERS = [
    'MALE',
    'FEMALE',
    'NON_BINARY',
    'PREFER_NOT_TO_SAY',
] as const

export type Gender = (typeof GENDERS)[number]

export function isGender(v: string): v is Gender {
    return GENDERS.includes(v as Gender)
}

export const CIVIL_STATUSES = [
    'SINGLE',
    'MARRIED',
    'SEPARATED',
    'WIDOWED',
    'ANNULLED'
] as const

export type CivilStatus = (typeof CIVIL_STATUSES)[number]

export function isCivilStatus(v: string): v is CivilStatus {
    return CIVIL_STATUSES.includes(v as CivilStatus)
}

export const PAYROLL_TYPES = [
    'MONTHLY',
    'DAILY',
] as const

export type PayrollType = (typeof PAYROLL_TYPES)[number]

export function isPayrollType(v: string): v is PayrollType {
    return PAYROLL_TYPES.includes(v as PayrollType)
}
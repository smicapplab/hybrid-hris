import type { EmployeeStatus } from '@hybrid-hris/domain'
import type {
    Employee as DbEmployee,
    EmployeeProfile as DbEmployeeProfile,
    EmployeeIdentifier as DbEmployeeIdentifier,
} from '@hybrid-hris/db/types'
import type { ShiftAssignment } from './attendance.types'

// ── Serialization utility ─────────────────────────────────────────────────────

type ISODateTimeString = string

type WithSerializedTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    createdAt?: ISODateTimeString
    updatedAt?: ISODateTimeString
    deletedAt?: ISODateTimeString | null
}

// ── Entity types ──────────────────────────────────────────────────────────────

export type EmployeeProfile = WithSerializedTimestamps<DbEmployeeProfile>
export type EmployeeIdentifiers = WithSerializedTimestamps<DbEmployeeIdentifier>

export type Employee = WithSerializedTimestamps<DbEmployee> & {
    email?: string | null
    profile?: EmployeeProfile | null
    identifiers?: EmployeeIdentifiers | null
    positionTitle?: string | null
    orgUnitName?: string | null
    jobLevelId?: string | null
    jobLevelName?: string | null
    policyId?: string | null
    roleIds?: string[]
    shiftAssignment?: ShiftAssignment | null
}

// ── Auxiliary API types ───────────────────────────────────────────────────────

export interface SupervisorOption {
    id: string
    firstName: string
    lastName: string
    employeeNo?: string
}

export interface StatusOptionsResponse {
    current: EmployeeStatus
    allowedNext: EmployeeStatus[]
}

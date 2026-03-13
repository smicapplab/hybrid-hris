
/* ============================================================
   HOLIDAY TYPES
   ============================================================ */

export const HOLIDAY_TYPES = [
    'REGULAR',
    'SPECIAL',
] as const

export type HolidayType = (typeof HOLIDAY_TYPES)[number]

export function isHolidayType(v: string): v is HolidayType {
    return HOLIDAY_TYPES.includes(v as HolidayType)
}

/* ============================================================
   OVERTIME REQUEST STATUSES
   ============================================================ */

export const OVERTIME_STATUSES = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
] as const

export type OvertimeStatus = (typeof OVERTIME_STATUSES)[number]

export function isOvertimeStatus(v: string): v is OvertimeStatus {
    return OVERTIME_STATUSES.includes(v as OvertimeStatus)
}

/* ============================================================
   OVERTIME TYPES
   ============================================================ */

export const OVERTIME_TYPES = [
    'REGULAR_OT',
    'REST_DAY_OT',
    'HOLIDAY_OT',
] as const

export type OvertimeType = (typeof OVERTIME_TYPES)[number]

export function isOvertimeType(v: string): v is OvertimeType {
    return OVERTIME_TYPES.includes(v as OvertimeType)
}

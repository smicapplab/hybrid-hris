


/**
 * Shared shift & attendance related enum values.
 * Follows same pattern as employee enums:
 * - const array (ALL_CAPS)
 * - derived union type
 * - type guard function
 */

/* ============================================================
   SHIFT FLEXIBILITY
   ============================================================ */

export const SHIFT_FLEXIBILITIES = [
    'FIXED',
    'FLEXIBLE',
] as const

export type ShiftFlexibility = (typeof SHIFT_FLEXIBILITIES)[number]

export function isShiftFlexibility(v: string): v is ShiftFlexibility {
    return SHIFT_FLEXIBILITIES.includes(v as ShiftFlexibility)
}

/* ============================================================
   ATTENDANCE EVENT TYPES
   ============================================================ */

export const ATTENDANCE_EVENT_TYPES = [
    'TIME_IN',
    'TIME_OUT',
    'BREAK_START',
    'BREAK_END',
] as const

export type AttendanceEventType =
    (typeof ATTENDANCE_EVENT_TYPES)[number]

export function isAttendanceEventType(
    v: string,
): v is AttendanceEventType {
    return ATTENDANCE_EVENT_TYPES.includes(
        v as AttendanceEventType,
    )
}

/* ============================================================
   ATTENDANCE ADJUSTMENT STATUSES
   ============================================================ */

export const ATTENDANCE_ADJUSTMENT_STATUSES = [
    'PENDING',
    'APPROVED',
    'REJECTED',
] as const

export type AttendanceAdjustmentStatus =
    (typeof ATTENDANCE_ADJUSTMENT_STATUSES)[number]

export function isAttendanceAdjustmentStatus(
    v: string,
): v is AttendanceAdjustmentStatus {
    return ATTENDANCE_ADJUSTMENT_STATUSES.includes(
        v as AttendanceAdjustmentStatus,
    )
}

/* ============================================================
   ATTENDANCE SOURCES
   ============================================================ */

export const ATTENDANCE_SOURCES = [
    'WEB',
    'MOBILE',
    'KIOSK',
    'API',
] as const

export type AttendanceSource =
    (typeof ATTENDANCE_SOURCES)[number]

export function isAttendanceSource(
    v: string,
): v is AttendanceSource {
    return ATTENDANCE_SOURCES.includes(
        v as AttendanceSource,
    )
}
export type DayType = 'FULL' | 'HALF'
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type LeaveRequest = {
    id: string
    leaveTypeId: string
    leaveTypeName: string
    startDate: string
    endDate: string
    startDayType: DayType
    endDayType: DayType
    days: number
    notes: string | null
    status: LeaveRequestStatus
    approvedAt: string | null
    createdAt: string
    // From the level-1 approval row
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
    approvalRemarks: string | null
    approvalActedAt: string | null
}

export type LeaveBalance = {
    leaveTypeId: string
    leaveTypeName: string
    isPaid: boolean
    balance: number
    pendingDays: number
}

export type TeamLeaveItem = {
    id: string
    leaveTypeId: string
    leaveTypeName: string
    startDate: string
    endDate: string
    startDayType: DayType
    endDayType: DayType
    days: number
    employeeId: string
    employeeFirstName: string
    employeeLastName: string
}

export type PendingApprovalItem = TeamLeaveItem & {
    notes: string | null
    status: LeaveRequestStatus
    createdAt: string
    approvalId: string
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
    approvalRemarks: string | null
    approvalActedAt: string | null
    currentBalance: number
}

export type MyUpcomingLeave = {
    id: string
    leaveTypeId: string
    leaveTypeName: string
    startDate: string
    endDate: string
    days: number
    status: LeaveRequestStatus
}

/** Compute total days from a date range + day types */
export function computeLeaveDays(
    startDate: string,
    endDate: string,
    startDayType: DayType,
    endDayType: DayType,
): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const calendarDays =
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    let total = calendarDays
    if (startDayType === 'HALF') total -= 0.5
    if (calendarDays > 1 && endDayType === 'HALF') total -= 0.5
    return total
}

/** Compute max end date (ISO string) given start, startDayType, and available balance */
export function computeMaxEndDate(
    startDate: string,
    startDayType: DayType,
    balance: number,
): string {
    // Start day costs 0.5 (HALF) or 1 (FULL).
    // Max additional full days from startDate+1: balance - startCost, rounded down.
    const startCost = startDayType === 'HALF' ? 0.5 : 1
    const remainingAfterStart = balance - startCost
    const extraDays = Math.max(0, Math.floor(remainingAfterStart + 0.5)) // allow one half-day end
    const d = new Date(startDate)
    d.setDate(d.getDate() + extraDays)
    return d.toISOString().split('T')[0]
}

export function formatDateRange(startDate: string, endDate: string): string {
    const fmt = (s: string) => {
        const d = new Date(s + 'T00:00:00')
        return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    if (startDate === endDate) return fmt(startDate)
    return `${fmt(startDate)} – ${fmt(endDate)}`
}

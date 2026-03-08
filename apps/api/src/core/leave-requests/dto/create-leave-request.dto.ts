export interface CreateLeaveRequestDto {
    leaveTypeId: string
    startDate: string      // YYYY-MM-DD
    endDate: string        // YYYY-MM-DD
    startDayType: 'FULL' | 'HALF'
    endDayType: 'FULL' | 'HALF'
    notes?: string
}

export interface ActOnLeaveRequestDto {
    remarks?: string
}

export interface LeaveRequestFilterDto {
    page?: number
    limit?: number
    search?: string
}
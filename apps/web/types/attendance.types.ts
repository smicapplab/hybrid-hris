export type AttendanceSource = 'WEB' | 'MOBILE' | 'KIOSK' | 'API';
export type AttendanceAdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type OvertimeType = 'REGULAR_OT' | 'REST_DAY_OT' | 'HOLIDAY_OT';
export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type AttendanceLog = {
    id: string;
    employeeId: string;
    workDate: string;
    scheduledInAt: string | null;
    scheduledOutAt: string | null;
    actualInAt: string | null;
    actualOutAt: string | null;
    sourceIn: AttendanceSource | null;
    sourceOut: AttendanceSource | null;
    totalHours: string;
    nightDiffHours: string;
    holidayHours: string;
    overtimeHours: string;
    status: string;
    isLocked: boolean;
    startTime: string | null;
    endTime: string | null;
    // Pending adjustment fields
    pendingAdjustmentId?: string | null;
    pendingActualInAt?: string | null;
    pendingActualOutAt?: string | null;
    pendingStatus?: AttendanceAdjustmentStatus | null;
    pendingRemarks?: string | null;
    pendingApproverRemarks?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OvertimeRequest = {
    id: string;
    employeeId: string;
    date: string;
    hours: string;
    type: OvertimeType;
    status: OvertimeStatus;
    reason: string;
    approverId: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PendingOvertimeItem = {
    request: OvertimeRequest;
    employee: {
        firstName: string;
        lastName: string;
        employeeNo: string;
    };
};

export type Holiday = {
    id: string;
    date: string;
    name: string;
    type: 'REGULAR' | 'SPECIAL';
    countryCode: string;
    createdAt: string;
    updatedAt: string;
};

export type AttendanceAdjustment = {
    id: string;
    employeeId: string;
    attendanceLogId: string | null;
    workDate: string;
    requestedActualInAt: string | null;
    requestedActualOutAt: string | null;
    previousActualInAt: string | null;
    previousActualOutAt: string | null;
    reasonCode: number | null;
    remarks: string;
    status: AttendanceAdjustmentStatus;
    requestedBy: string;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PendingAdjustmentItem = {
    adjustment: AttendanceAdjustment;
    employee: {
        firstName: string;
        lastName: string;
        employeeNo: string;
    };
};

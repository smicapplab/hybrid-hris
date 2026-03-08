export type AttendanceSource = 'WEB' | 'MOBILE' | 'KIOSK' | 'API';
export type AttendanceAdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

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

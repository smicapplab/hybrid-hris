import {
    IsUUID,
    IsOptional,
    IsDateString,
    IsInt,
    Min,
} from 'class-validator'

export class CreateAttendanceAdjustmentDto {
    @IsUUID()
    employeeId!: string

    @IsUUID()
    attendanceLogId!: string

    /** Requested corrected clock-in time (ISO-8601 with offset). */
    @IsOptional()
    @IsDateString()
    requestedActualInAt?: string

    /** Requested corrected clock-out time (ISO-8601 with offset). */
    @IsOptional()
    @IsDateString()
    requestedActualOutAt?: string

    /** Predefined reason code (optional). */
    @IsOptional()
    @IsInt()
    @Min(0)
    reason?: number
}

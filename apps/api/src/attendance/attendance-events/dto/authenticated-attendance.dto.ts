import { IsEnum } from 'class-validator'
import { ATTENDANCE_SOURCES, AttendanceSource } from '@hybrid-hris/domain'

export class AuthenticatedAttendanceDto {
    @IsEnum(ATTENDANCE_SOURCES)
    source!: AttendanceSource
}
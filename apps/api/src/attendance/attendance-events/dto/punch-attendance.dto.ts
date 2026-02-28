import { IsString, IsEnum } from 'class-validator'
import { ATTENDANCE_SOURCES, AttendanceSource } from '@hybrid-hris/domain'

export class PunchAttendanceDto {
    @IsString()
    employeeNumber!: string

    @IsString()
    pin!: string

    @IsEnum(ATTENDANCE_SOURCES)
    source!: AttendanceSource
}
import { IsIn } from 'class-validator'
import { EmployeeStatus, EMPLOYEE_STATUSES } from '@hybrid-hris/domain'

export class ChangeEmployeeStatusDto {
    @IsIn(EMPLOYEE_STATUSES)
    status!: EmployeeStatus
}
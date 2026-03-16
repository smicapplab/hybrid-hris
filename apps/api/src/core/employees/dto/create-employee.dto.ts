import {
    IsArray,
    IsDateString,
    IsEmail,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator'
import { EmploymentType, EMPLOYMENT_TYPES } from '@hybrid-hris/domain'

export class CreateEmployeeDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    employeeNo?: string

    @IsString()
    @MinLength(1)
    firstName!: string

    @IsOptional()
    @IsString()
    middleName?: string

    @IsString()
    @MinLength(1)
    lastName!: string

    // Login email — the username used to sign in
    @IsEmail()
    email!: string

    // Where credentials will be sent (personal or alternate work email)
    @IsOptional()
    @IsEmail()
    alternateEmail?: string

    // Plain-text password — always required; generation happens client-side
    // so the HR admin can view and copy it before sending credentials.
    @IsString()
    @MinLength(8)
    password!: string

    @IsUUID()
    orgUnitId!: string

    @IsUUID()
    positionId!: string

    @IsOptional()
    @IsUUID()
    jobLevelId?: string

    @IsOptional()
    @IsUUID()
    supervisorId?: string

    @IsDateString()
    hireDate!: string

    @IsOptional()
    @IsIn(EMPLOYMENT_TYPES)
    employmentType?: EmploymentType

    // Additional roles (EMPLOYEE will always be assigned automatically)
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    roleIds?: string[]
}
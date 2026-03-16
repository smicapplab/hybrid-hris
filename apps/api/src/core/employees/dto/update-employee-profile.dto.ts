import {
    IsOptional,
    IsString,
    IsDateString,
    IsIn,
    MaxLength,
    IsEmail,
    Matches,
    IsNumber,
    Min,
    Max,
} from 'class-validator'
import { Gender, GENDERS, CivilStatus, CIVIL_STATUSES, PayrollType, PAYROLL_TYPES } from '@hybrid-hris/domain'
import { Type } from 'class-transformer'

export class UpdateEmployeeProfileDto {
    @IsOptional()
    @IsDateString()
    birthDate?: string

    @IsOptional()
    @IsIn(GENDERS)
    gender?: Gender

    @IsOptional()
    @IsIn(CIVIL_STATUSES)
    civilStatus?: CivilStatus

    @IsOptional()
    @IsString()
    @MaxLength(80)
    nationality?: string

    @IsOptional()
    @IsEmail()
    personalEmail?: string

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @Matches(/^[0-9+\-\s().x]*$/, { message: 'Invalid mobile number format' })
    mobileNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @Matches(/^[0-9+\-\s().x]*$/, { message: 'Invalid mobile number format' })
    landlineNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(160)
    emergencyContactName?: string

    @IsOptional()
    @IsString()
    @MaxLength(60)
    emergencyContactRelationship?: string

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @Matches(/^[0-9+\-\s().x]*$/, { message: 'Invalid mobile number format' })
    emergencyContactMobileNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string

    @IsOptional()
    @IsIn(PAYROLL_TYPES)
    payrollType?: PayrollType

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(400)
    @Type(() => Number)
    factorRate?: number
}
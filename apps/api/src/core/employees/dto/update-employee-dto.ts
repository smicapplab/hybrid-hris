import {
    IsOptional,
    IsString,
    IsEmail,
    IsUUID,
    IsDateString,
    IsIn,
    MaxLength,
    Matches,
    ValidateIf,
    ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { EmploymentType, EMPLOYMENT_TYPES, TIMEZONES } from '@hybrid-hris/domain'
import { UpdateEmployeeProfileDto } from './update-employee-profile.dto'
import { UpdateEmployeeIdentifiersDto } from './update-employee-identifiers.dto'

const NON_EMPTY = /\S/
const COUNTRY_CODE = /^[A-Z]{2,3}$/

export class UpdateEmployeeDto {
    // Identity
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'firstName cannot be empty' })
    firstName?: string

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'middleName cannot be empty' })
    middleName?: string

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'lastName cannot be empty' })
    lastName?: string

    // Email
    // - `email` is the unique login email (stored in `users`) but is editable from the employee screen
    // - `alternateEmail` is stored on `employees`
    @IsOptional()
    @IsEmail()
    alternateEmail?: string

    @IsOptional()
    @IsEmail()
    email?: string

    // Employment
    @IsOptional()
    @IsDateString()
    hireDate?: string

    @IsOptional()
    @IsIn(EMPLOYMENT_TYPES)
    employmentType?: EmploymentType

    // Address (kept on employees)
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'addressLine1 cannot be empty' })
    addressLine1?: string

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'addressLine2 cannot be empty' })
    addressLine2?: string

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'city cannot be empty' })
    city?: string

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'province cannot be empty' })
    province?: string

    @IsOptional()
    @IsString()
    @MaxLength(20)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'postalCode cannot be empty' })
    postalCode?: string

    @IsOptional()
    @IsString()
    @MaxLength(10)
    @ValidateIf((_, v) => typeof v === 'string')
    @Matches(NON_EMPTY, { message: 'countryCode cannot be empty' })
    @Matches(COUNTRY_CODE, { message: 'countryCode must be an ISO alpha-2/3 code (e.g., PH)' })
    countryCode?: string

    @IsOptional()
    @IsIn(TIMEZONES, { message: 'timezone must be a valid IANA timezone' })
    timezone?: string | null

    // Org / Position / Reporting
    @IsOptional()
    @IsUUID()
    orgUnitId?: string

    @IsOptional()
    @IsUUID()
    positionId?: string

    @IsOptional()
    @IsUUID()
    supervisorId?: string | null

    @IsOptional()
    @IsUUID()
    policyId?: string

    @IsOptional()
    @IsUUID('4', { each: true })
    roleIds?: string[]

    // Optional nested updates (handled in service layer)
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateEmployeeProfileDto)
    profile?: UpdateEmployeeProfileDto

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateEmployeeIdentifiersDto)
    identifiers?: UpdateEmployeeIdentifiersDto
}
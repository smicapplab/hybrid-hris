import {
    IsOptional,
    IsString,
    IsDateString,
    IsIn,
    MaxLength,
    IsEmail,
    Matches,
} from 'class-validator'
import { Gender, GENDERS, CivilStatus, CIVIL_STATUSES } from '@hybrid-hris/domain'

export class UpdateMyProfileDto {
    /* ── Employee table (address + alternate email) ── */

    @IsOptional()
    @IsEmail()
    alternateEmail?: string

    @IsOptional()
    @IsString()
    @MaxLength(250)
    addressLine1?: string

    @IsOptional()
    @IsString()
    @MaxLength(250)
    addressLine2?: string

    @IsOptional()
    @IsString()
    @MaxLength(120)
    city?: string

    @IsOptional()
    @IsString()
    @MaxLength(120)
    province?: string

    @IsOptional()
    @IsString()
    @MaxLength(20)
    postalCode?: string

    @IsOptional()
    @IsString()
    @MaxLength(10)
    countryCode?: string

    /* ── Employee profile table ── */

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
    @Matches(/^[0-9+\-\s()]*$/, { message: 'Invalid phone number format' })
    mobileNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @Matches(/^[0-9+\-\s()]*$/, { message: 'Invalid phone number format' })
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
    @Matches(/^[0-9+\-\s()]*$/, { message: 'Invalid phone number format' })
    emergencyContactMobileNo?: string
}

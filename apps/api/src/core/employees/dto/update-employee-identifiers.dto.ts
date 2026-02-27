import {
    IsOptional,
    IsString,
    MaxLength,
    IsDateString,
    Matches,
} from 'class-validator'

export class UpdateEmployeeIdentifiersDto {
    // --- Government IDs (PH numeric only typical) ---

    @IsOptional()
    @IsString()
    @MaxLength(32)
    @Matches(/^[0-9-]*$/, { message: 'TIN must contain only digits or hyphens' })
    tinNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(32)
    @Matches(/^[0-9-]*$/, { message: 'SSS must contain only digits or hyphens' })
    sssNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(32)
    @Matches(/^[0-9-]*$/, { message: 'PhilHealth must contain only digits or hyphens' })
    philHealthNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(32)
    @Matches(/^[0-9-]*$/, { message: 'Pag-IBIG must contain only digits or hyphens' })
    pagIbigNo?: string

    @IsOptional()
    @IsString()
    @MaxLength(32)
    @Matches(/^[0-9-]*$/, { message: 'UMID must contain only digits or hyphens' })
    umidNo?: string

    // --- Passport ---

    @IsOptional()
    @IsString()
    @MaxLength(32)
    passportNo?: string

    @IsOptional()
    @IsDateString()
    passportExpiry?: string

    // --- Driver's License ---

    @IsOptional()
    @IsString()
    @MaxLength(32)
    driversLicenseNo?: string

    @IsOptional()
    @IsDateString()
    driversLicenseExpiry?: string

    // --- PRC License ---

    @IsOptional()
    @IsString()
    @MaxLength(32)
    prcLicenseNo?: string

    @IsOptional()
    @IsDateString()
    prcLicenseExpiry?: string

    // --- Company Issued ---

    @IsOptional()
    @IsString()
    @MaxLength(64)
    companyIdNo?: string
}
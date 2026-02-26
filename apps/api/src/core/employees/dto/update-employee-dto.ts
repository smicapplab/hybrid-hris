import { IsOptional, IsString, IsEmail, IsUUID, Length } from 'class-validator'

export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    @Length(1, 100)
    firstName?: string

    @IsOptional()
    @IsString()
    @Length(1, 100)
    middleName?: string

    @IsOptional()
    @IsString()
    @Length(1, 100)
    lastName?: string

    @IsOptional()
    @IsEmail()
    alternateEmail?: string

    @IsOptional()
    @IsString()
    @Length(1, 255)
    addressLine1?: string

    @IsOptional()
    @IsString()
    @Length(1, 255)
    addressLine2?: string

    @IsOptional()
    @IsString()
    @Length(1, 100)
    city?: string

    @IsOptional()
    @IsString()
    @Length(1, 100)
    province?: string

    @IsOptional()
    @IsString()
    @Length(1, 20)
    postalCode?: string

    @IsOptional()
    @IsString()
    @Length(2, 2)
    countryCode?: string

    @IsOptional()
    @IsUUID()
    orgUnitId?: string

    @IsOptional()
    @IsUUID()
    positionId?: string

    @IsOptional()
    @IsUUID()
    supervisorId?: string
}
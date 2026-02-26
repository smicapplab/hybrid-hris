import {
    IsArray,
    IsDateString,
    IsEmail,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator'

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

    @IsEmail()
    email!: string

    @IsUUID()
    orgUnitId!: string

    @IsUUID()
    positionId!: string

    @IsOptional()
    @IsUUID()
    supervisorId?: string

    @IsDateString()
    hireDate!: string

    // Additional roles (EMPLOYEE will always be assigned automatically)
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    roleIds?: string[]
}
import { IsBoolean, IsOptional, IsString, IsArray, ArrayUnique, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UpdateHrSettingsDto {
    @IsString()
    @IsOptional()
    @MaxLength(10)
    employeeNoPrefix?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    employeeNoNext?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(10)
    employeeNoPadding?: number;

    @IsString()
    @IsOptional()
    @MaxLength(253)
    emailDomain?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    timezone?: string;

    @IsBoolean()
    @IsOptional()
    passwordLoginEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    googleLoginEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    microsoftLoginEnabled?: boolean;

    @IsArray()
    @IsString({ each: true })
    @ArrayUnique()
    @IsOptional()
    allowedWorkspaceDomains?: string[];
}

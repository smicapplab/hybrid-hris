import { IsString, IsEnum, IsBoolean, IsOptional, IsDecimal, MaxLength } from 'class-validator';

export class CreatePayrollComponentDto {
    @IsString()
    @MaxLength(50)
    code!: string;

    @IsString()
    @MaxLength(150)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(['EARNING', 'DEDUCTION'])
    type!: 'EARNING' | 'DEDUCTION';

    @IsBoolean()
    isTaxable!: boolean;

    @IsBoolean()
    isDeMinimis!: boolean;

    @IsBoolean()
    isStatutory!: boolean;

    @IsBoolean()
    isRecurring!: boolean;

    @IsOptional()
    @IsDecimal()
    taxExemptLimit?: string;
}

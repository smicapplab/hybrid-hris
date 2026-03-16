import { IsUUID, IsDecimal, IsDateString, IsOptional } from 'class-validator';

export class CreateEmployeeCompensationDto {
    @IsUUID()
    employeeId!: string;

    @IsUUID()
    payrollComponentId!: string;

    @IsDecimal()
    amount!: string;

    @IsDateString()
    effectiveFrom!: string;

    @IsOptional()
    @IsDateString()
    effectiveTo?: string;
}

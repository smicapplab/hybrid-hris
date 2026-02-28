import { IsOptional, IsDateString } from 'class-validator'

export class UpdateShiftAssignmentDto {
    @IsOptional()
    @IsDateString()
    effectiveFrom?: string

    @IsOptional()
    @IsDateString()
    effectiveTo?: string | null
}
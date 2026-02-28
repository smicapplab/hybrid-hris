import {
    IsUUID,
    IsDateString,
    IsOptional,
    IsObject,
    ValidateNested,
    IsString,
    Matches,
    IsInt,
    Min,
    IsBoolean,
} from 'class-validator'
import { Type } from 'class-transformer'

class OverrideShiftDto {
    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    startTime?: string

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    endTime?: string

    @IsOptional()
    @IsInt()
    @Min(0)
    breakMinutes?: number

    @IsOptional()
    @IsBoolean()
    isFlexible?: boolean
}

export class CreateShiftAssignmentDto {
    @IsUUID()
    employeeId!: string

    @IsUUID()
    shiftTemplateId!: string

    @IsDateString()
    effectiveFrom!: string

    @IsOptional()
    @IsDateString()
    effectiveTo?: string | null

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => OverrideShiftDto)
    override?: OverrideShiftDto
}
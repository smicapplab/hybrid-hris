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
    @IsInt()
    @Min(0)
    gracePeriodMinutes?: number

    @IsOptional()
    @IsBoolean()
    isFlexible?: boolean

    // Work-day overrides — only provide if you want to deviate from the template defaults
    @IsOptional()
    @IsBoolean()
    isMon?: boolean

    @IsOptional()
    @IsBoolean()
    isTue?: boolean

    @IsOptional()
    @IsBoolean()
    isWed?: boolean

    @IsOptional()
    @IsBoolean()
    isThu?: boolean

    @IsOptional()
    @IsBoolean()
    isFri?: boolean

    @IsOptional()
    @IsBoolean()
    isSat?: boolean

    @IsOptional()
    @IsBoolean()
    isSun?: boolean
}

export class CreateShiftAssignmentDto {
    @IsUUID()
    employeeId!: string

    @IsUUID()
    shiftTemplateId!: string

    /** The date this assignment takes effect. */
    @IsDateString()
    effectiveFrom!: string

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => OverrideShiftDto)
    override?: OverrideShiftDto
}

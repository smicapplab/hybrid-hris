import {
    IsOptional,
    IsDateString,
    IsString,
    Matches,
    IsInt,
    Min,
    IsBoolean,
} from 'class-validator'

/**
 * Partial patch of the employee's current shift assignment.
 * Use CreateShiftAssignmentDto to reassign to a different template entirely.
 */
export class UpdateShiftAssignmentDto {
    @IsOptional()
    @IsDateString()
    effectiveFrom?: string

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

import {
    IsOptional,
    IsString,
    IsBoolean,
    IsInt,
    Min,
    Matches,
    Length,
} from 'class-validator'

export class UpdateShiftTemplateDto {
    @IsOptional()
    @IsString()
    @Length(1, 150)
    name?: string

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
    isActive?: boolean

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
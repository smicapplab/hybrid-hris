import {
    IsString,
    IsBoolean,
    IsInt,
    Min,
    Matches,
    Length,
} from 'class-validator'

export class CreateShiftTemplateDto {
    @IsString()
    @Length(1, 50)
    code!: string

    @IsString()
    @Length(1, 150)
    name!: string

    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    startTime!: string

    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    endTime!: string

    @IsInt()
    @Min(0)
    breakMinutes!: number

    @IsInt()
    @Min(0)
    gracePeriodMinutes!: number

    @IsBoolean()
    isFlexible!: boolean

    @IsBoolean()
    isActive!: boolean

    // Work-day schedule — which days of the week this shift runs
    @IsBoolean()
    isMon!: boolean

    @IsBoolean()
    isTue!: boolean

    @IsBoolean()
    isWed!: boolean

    @IsBoolean()
    isThu!: boolean

    @IsBoolean()
    isFri!: boolean

    @IsBoolean()
    isSat!: boolean

    @IsBoolean()
    isSun!: boolean
}
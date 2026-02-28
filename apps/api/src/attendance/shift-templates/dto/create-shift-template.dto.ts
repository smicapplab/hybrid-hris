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

    @IsBoolean()
    isFlexible!: boolean

    @IsBoolean()
    isActive!: boolean
}
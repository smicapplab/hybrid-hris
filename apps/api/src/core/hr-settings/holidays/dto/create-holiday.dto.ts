import { IsDateString, IsEnum, IsBoolean, IsString, IsOptional, MaxLength } from 'class-validator';
import { HolidayType } from '@hybrid-hris/domain';

export class CreateHolidayDto {
    @IsDateString()
    date!: string;

    @IsString()
    @MaxLength(150)
    name!: string;

    @IsEnum(['REGULAR', 'SPECIAL'])
    type!: HolidayType;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    countryCode?: string;

    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;
}

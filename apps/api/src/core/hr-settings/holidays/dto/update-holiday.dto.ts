import { IsDateString, IsEnum, IsBoolean, IsString, IsOptional, MaxLength } from 'class-validator';
import { HolidayType } from '@hybrid-hris/domain';

export class UpdateHolidayDto {
    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @MaxLength(150)
    @IsOptional()
    name?: string;

    @IsEnum(['REGULAR', 'SPECIAL'])
    @IsOptional()
    type?: HolidayType;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    countryCode?: string;

    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;
}

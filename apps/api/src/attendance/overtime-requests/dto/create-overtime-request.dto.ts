import { IsString, IsNotEmpty, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { OvertimeType } from '@hybrid-hris/domain';

export class CreateOvertimeRequestDto {
    @IsDateString()
    @IsNotEmpty()
    date!: string;

    @IsNumber()
    @Min(0.5)
    @IsNotEmpty()
    hours!: number;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['REGULAR_OT', 'REST_DAY_OT', 'HOLIDAY_OT'])
    type!: OvertimeType;

    @IsString()
    @IsNotEmpty()
    reason!: string;
}

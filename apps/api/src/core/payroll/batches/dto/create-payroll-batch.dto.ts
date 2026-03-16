import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreatePayrollBatchDto {
    @IsString()
    @IsNotEmpty()
    name: string = '';

    @IsDateString()
    @IsNotEmpty()
    startDate: string = '';

    @IsDateString()
    @IsNotEmpty()
    endDate: string = '';
}

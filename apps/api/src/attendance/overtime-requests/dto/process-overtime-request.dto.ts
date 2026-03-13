import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class ProcessOvertimeRequestDto {
    @IsString()
    @IsNotEmpty()
    @IsEnum(['APPROVED', 'REJECTED'])
    status!: 'APPROVED' | 'REJECTED';

    @IsString()
    @IsOptional()
    rejectionReason?: string;
}

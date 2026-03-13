import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { OvertimeStatus } from '@hybrid-hris/domain';

export class ProcessOvertimeRequestDto {
    @IsString()
    @IsNotEmpty()
    @IsEnum(['APPROVED', 'REJECTED'])
    status!: 'APPROVED' | 'REJECTED';

    @IsString()
    @IsOptional()
    rejectionReason?: string;
}

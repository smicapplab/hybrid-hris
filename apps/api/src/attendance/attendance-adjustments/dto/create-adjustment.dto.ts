import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateAdjustmentDto {
    @IsDateString()
    @IsNotEmpty()
    workDate!: string;

    @IsUUID()
    @IsOptional()
    attendanceLogId?: string;

    @IsDateString()
    @IsOptional()
    requestedActualInAt?: string;

    @IsDateString()
    @IsOptional()
    requestedActualOutAt?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    remarks!: string;
}

export class ActOnAdjustmentDto {
    @IsString()
    @IsOptional()
    @MaxLength(500)
    remarks?: string;
}

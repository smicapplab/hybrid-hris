import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { 
    ManpowerRequestType, 
    EmploymentType, 
    RequestPriority,
    ManpowerApprovalStatus
} from '@hybrid-hris/domain';

export class CreateManpowerRequestDto {
    @IsUUID()
    @IsNotEmpty()
    orgUnitId!: string;

    @IsUUID()
    @IsOptional()
    positionId?: string;

    @IsString()
    @IsNotEmpty()
    jobTitle!: string;

    @IsEnum(['NEW_HEADCOUNT', 'REPLACEMENT', 'PROJECT_BASED'])
    requestType!: ManpowerRequestType;

    @IsInt()
    @Min(1)
    quantity!: number;

    @IsEnum(['REGULAR', 'PROBATIONARY', 'CONTRACTUAL', 'CONSULTANT', 'INTERN'])
    employmentType!: EmploymentType;

    @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
    @IsOptional()
    priority?: RequestPriority;

    @IsString()
    @IsOptional()
    jobSummary?: string;

    @IsString()
    @IsOptional()
    jobDescription?: string;

    @IsString()
    @IsOptional()
    responsibilities?: string;

    @IsString()
    @IsOptional()
    qualifications?: string;

    @IsString()
    @IsOptional()
    targetHireDate?: string;
}

export class ActOnManpowerRequestDto {
    @IsEnum(['APPROVED', 'REJECTED'])
    status!: ManpowerApprovalStatus;

    @IsString()
    @IsOptional()
    remarks?: string;
}

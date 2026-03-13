import { IsString, IsEnum, IsOptional, IsUUID, IsBoolean, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ProficiencyLevel, TrainingType, TrainingEnrollmentStatus, TrainingScheduleStatus } from '@hybrid-hris/domain';

export interface TeamComplianceInfo {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string;
  positionId: string | null;
  orgUnitId: string | null;
  positionTitle: string | null;
  requiredCount: number;
  completedCount: number;
  missingMandatory: { id: string; title: string }[];
  scheduledMandatory: { id: string; title: string; scheduleId: string; startAt: Date }[];
  isCompliant: boolean;
}

export interface MyTrainingInfo {
  id: string;
  programId: string;
  status: string;
  trainerId: string | null;
  externalTrainer: string | null;
  location: string | null;
  capacity: number | null;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
  updatedAt: Date;
  enrollmentStatus: string;
  programTitle: string;
  programType: string;
  isMandatory: boolean;
}

export interface AttendeeInfo {
  enrollmentId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeNo: string;
  orgUnitName: string | null;
  status: TrainingEnrollmentStatus;
  processedAt: Date | null;
}

export class CreateTrainingProgramDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsEnum(['INTERNAL', 'EXTERNAL'])
  type!: TrainingType;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsArray()
  skillIds?: { id: string; level: ProficiencyLevel }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[];
}

export class UpdateTrainingProgramDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsEnum(['INTERNAL', 'EXTERNAL'])
  type?: TrainingType;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsArray()
  skillIds?: { id: string; level: ProficiencyLevel }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[];
}

export class CreateTrainingScheduleDto {
  @IsUUID()
  programId!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @IsOptional()
  @IsString()
  externalTrainer?: string;

  @IsOptional()
  @IsEnum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: TrainingScheduleStatus;

  @IsOptional()
  @IsArray()
  sessions?: { title?: string; location?: string; startAt: string; endAt: string }[];
}

export class UpdateTrainingScheduleDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @IsOptional()
  @IsString()
  externalTrainer?: string;

  @IsOptional()
  @IsEnum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: TrainingScheduleStatus;

  @IsOptional()
  @IsArray()
  sessions?: { title?: string; location?: string; startAt: string; endAt: string }[];
}

export class UpdateAttendeeStatusDto {
  @IsEnum(['ENROLLED', 'COMPLETED', 'CANCELLED', 'NOSHOW'])
  status!: TrainingEnrollmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkUpdateAttendeeStatusDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  enrollmentIds!: string[];

  @IsEnum(['ENROLLED', 'COMPLETED', 'CANCELLED', 'NOSHOW'])
  status!: TrainingEnrollmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddMandatoryTrainingDto {
  @IsUUID()
  @IsOptional()
  positionId?: string;

  @IsUUID()
  @IsOptional()
  orgUnitId?: string;

  @IsUUID()
  programId!: string;
}

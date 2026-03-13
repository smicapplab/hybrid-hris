import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ProficiencyLevel } from '@hybrid-hris/domain';

export interface EndorsementInfo {
  id: string;
  employeeSkillId: string;
  endorserId: string;
  endorserName: string;
  message: string | null;
  createdAt: Date;
}

export interface EmployeeSkillInfo {
  id: string;
  skillId: string;
  skillName: string;
  skillType: string;
  proficiencyLevel: ProficiencyLevel;
  source: string;
  verificationStatus: string;
  acquiredDate: string;
  expiryDate: string | null;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  evidenceUrl: string | null;
  notes: string | null;
  verifiedAt: Date | null;
  endorsements?: EndorsementInfo[];
}

export interface TalentCardData {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string;
    positionId: string | null;
    positionTitle: string | null;
    orgUnitId: string | null;
    orgUnitName: string | null;
    email: string | null;
    supervisorId: string | null;
  };
  skills: {
    actual: EmployeeSkillInfo[];
    required: { skillId: string; skillName: string; requiredLevel: string }[];
  };
  training: {
    enrollments: { id: string; status: string; programId: string; programTitle: string; startAt: Date }[];
    missingMandatory: { id: string; title: string }[];
    scheduledMandatory: { id: string; title: string; scheduleId: string; startAt: Date }[];
  };
  upcomingLeaves: {
    id: string;
    startDate: string;
    endDate: string;
    days: string;
    status: string;
  }[];
  schedule: {
    startTime: string;
    endTime: string;
    isFlexible: boolean;
    effectiveFrom: string;
  } | null;
}

export interface TaxonomySkillInfo {
  id: string;
  name: string;
  type: string;
  description: string | null;
  expiryMonths: number | null;
  isActive: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxonomyCategoryInfo {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  skills: TaxonomySkillInfo[];
}

export interface SkillGapCell {
  skillId: string;
  status: 'MET' | 'BELOW' | 'MISSING' | 'NA';
  actual?: ProficiencyLevel;
  target?: ProficiencyLevel;
}

export interface SkillGapRow {
  employeeId: string;
  employeeName: string;
  positionTitle: string | null;
  cells: SkillGapCell[];
}

export class AssignSkillDto {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  skillId!: string;

  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  proficiencyLevel!: ProficiencyLevel;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeclareSkillDto {
  @IsUUID()
  skillId!: string;

  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  proficiencyLevel!: ProficiencyLevel;

  @IsDateString()
  acquiredDate!: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessSkillApprovalDto {
  @IsEnum(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSkillCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSkillCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSkillDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  expiryMonths?: number;
}

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  expiryMonths?: number | null;

  @IsOptional()
  isActive?: boolean;
}

export class AddSkillToPositionDto {
  @IsUUID()
  positionId!: string;

  @IsUUID()
  skillId!: string;

  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  requiredProficiencyLevel!: ProficiencyLevel;
}

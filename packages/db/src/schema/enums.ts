import { pgEnum } from 'drizzle-orm/pg-core';
import { 
  PROFICIENCY_LEVELS, 
  SKILL_SOURCES, 
  SKILL_VERIFICATION_STATUSES,
  TRAINING_TYPES,
  TRAINING_ENROLLMENT_STATUSES,
  TRAINING_SCHEDULE_STATUSES,
  HOLIDAY_TYPES,
  OVERTIME_STATUSES,
  OVERTIME_TYPES
} from '@hybrid-hris/domain';

export const proficiencyLevelEnum = pgEnum('proficiency_level', PROFICIENCY_LEVELS);
export const skillSourceEnum = pgEnum('skill_source', SKILL_SOURCES);
export const skillVerificationStatusEnum = pgEnum('skill_verification_status', SKILL_VERIFICATION_STATUSES);

export const trainingTypeEnum = pgEnum('training_type', TRAINING_TYPES);
export const trainingEnrollmentStatusEnum = pgEnum('training_enrollment_status', TRAINING_ENROLLMENT_STATUSES);
export const trainingScheduleStatusEnum = pgEnum('training_schedule_status', TRAINING_SCHEDULE_STATUSES);

export const holidayTypeEnum = pgEnum('holiday_type', HOLIDAY_TYPES);
export const overtimeStatusEnum = pgEnum('overtime_status', OVERTIME_STATUSES);
export const overtimeTypeEnum = pgEnum('overtime_type', OVERTIME_TYPES);

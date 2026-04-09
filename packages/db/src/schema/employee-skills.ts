import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  date,
  unique,
  varchar,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { skills } from './skills';
import { trainingEnrollments } from './training-enrollments';
import { proficiencyLevelEnum, skillSourceEnum, skillVerificationStatusEnum } from './enums';

export { proficiencyLevelEnum, skillSourceEnum, skillVerificationStatusEnum };

export const employeeSkills = pgTable(
  'employee_skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),

    // Traceability to internal training
    trainingEnrollmentId: uuid('training_enrollment_id')
      .references(() => trainingEnrollments.id, { onDelete: 'set null' }),

    proficiencyLevel: proficiencyLevelEnum('proficiency_level').notNull(),
    source: skillSourceEnum('skill_source').notNull(),
    verificationStatus: skillVerificationStatusEnum('skill_verification_status')
      .default('PENDING')
      .notNull(),

    // Evidence link for external/self-claimed skills
    evidenceUrl: varchar('evidence_url', { length: 2048 }),
    notes: text('notes'),

    acquiredDate: date('acquired_date').notNull(),
    expiryDate: date('expiry_date'),

    verifiedById: uuid('verified_by_id').references(() => employees.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    employeeSkillUq: unique('employee_skills_employee_skill_uq').on(t.employeeId, t.skillId),
    employeeIdx: index('employee_skills_employee_idx').on(t.employeeId),
    skillIdx: index('employee_skills_skill_idx').on(t.skillId),
    trainingEnrollmentIdx: index('employee_skills_training_enrollment_idx').on(t.trainingEnrollmentId),
    verifiedByIdx: index('employee_skills_verified_by_idx').on(t.verifiedById),
    statusIdx: index('employee_skills_status_idx').on(t.verificationStatus),
  })
);

// New: 360 Endorsements
export const employeeSkillEndorsements = pgTable(
  'employee_skill_endorsements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeSkillId: uuid('employee_skill_id')
      .notNull()
      .references(() => employeeSkills.id, { onDelete: 'cascade' }),
    
    endorserId: uuid('endorser_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    
    message: text('message'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    skillIdx: index('skill_endorsements_skill_idx').on(t.employeeSkillId),
    endorserIdx: index('skill_endorsements_endorser_idx').on(t.endorserId),
  })
);

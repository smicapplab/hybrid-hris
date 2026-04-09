import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { skills } from './skills';
import { positions } from './positions';
import { orgUnits } from './org-units';
import { trainingTypeEnum, proficiencyLevelEnum } from './enums';

export { trainingTypeEnum };

export const trainingPrograms = pgTable(
  'training_programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    objectives: text('objectives'),
    type: trainingTypeEnum('type').default('INTERNAL').notNull(),
    
    // Whether this training is mandatory for all or specific groups
    isMandatory: boolean('is_mandatory').default(false).notNull(),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const trainingProgramSkills = pgTable(
  'training_program_skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    
    // The proficiency level granted upon completion
    grantedProficiencyLevel: proficiencyLevelEnum('granted_proficiency_level').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    programIdx: index('training_program_skills_program_idx').on(t.programId),
    skillIdx: index('training_program_skills_skill_idx').on(t.skillId),
  })
);

// Prerequisite management
export const trainingPrerequisites = pgTable(
  'training_prerequisites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: 'cascade' }),
    prerequisiteProgramId: uuid('prerequisite_program_id')
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uq: uniqueIndex('training_prerequisites_uq').on(t.programId, t.prerequisiteProgramId),
    prerequisiteIdx: index('training_prerequisites_prerequisite_idx').on(t.prerequisiteProgramId),
  })
);

// NEW: Position-specific mandatory training
export const positionMandatoryTrainings = pgTable(
  'position_mandatory_trainings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    positionId: uuid('position_id')
      .notNull()
      .references(() => positions.id, { onDelete: 'cascade' }),
    programId: uuid('program_id')
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uq: uniqueIndex('position_mandatory_trainings_uq').on(t.positionId, t.programId),
    programIdx: index('position_mandatory_trainings_program_idx').on(t.programId),
  })
);

// NEW: Org Unit-specific mandatory training
export const orgUnitMandatoryTrainings = pgTable(
  'org_unit_mandatory_trainings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgUnitId: uuid('org_unit_id')
      .notNull()
      .references(() => orgUnits.id, { onDelete: 'cascade' }),
    programId: uuid('program_id')
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uq: uniqueIndex('org_unit_mandatory_trainings_uq').on(t.orgUnitId, t.programId),
    programIdx: index('org_unit_mandatory_trainings_program_idx').on(t.programId),
  })
);

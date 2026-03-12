import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { skills } from './skills';
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
  }
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
  })
);

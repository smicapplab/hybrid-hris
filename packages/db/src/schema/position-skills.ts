import {
  pgTable,
  uuid,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { positions } from './positions';
import { skills } from './skills';
import { proficiencyLevelEnum } from './enums';

export const positionSkills = pgTable(
  'position_skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    positionId: uuid('position_id')
      .notNull()
      .references(() => positions.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),

    requiredProficiencyLevel: proficiencyLevelEnum('required_proficiency_level').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    positionIdx: index('position_skills_position_idx').on(t.positionId),
    skillIdx: index('position_skills_skill_idx').on(t.skillId),
    // Ensure one skill can only be assigned once to a position
    uq: unique('position_skills_position_skill_uq').on(t.positionId, t.skillId),
  })
);

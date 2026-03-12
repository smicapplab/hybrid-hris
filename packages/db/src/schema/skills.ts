import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { skillCategories } from './skill-categories';

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => skillCategories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    type: varchar('type', { length: 50 }).default('TECHNICAL').notNull(),
    description: text('description'),
    
    // Optional expiry in months (e.g., 12 for annual certification)
    expiryMonths: integer('expiry_months'),
    
    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: index('skills_name_idx').on(t.name),
    categoryIdx: index('skills_category_idx').on(t.categoryId),
  })
);

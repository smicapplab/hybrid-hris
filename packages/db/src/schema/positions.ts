import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Global reusable position code (e.g., MANAGER, SOFTWARE_ENGINEER)
    code: varchar('code', { length: 100 }).notNull(),

    // Human-readable title
    title: varchar('title', { length: 200 }).notNull(),

    // Optional description
    description: text('description'),

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqueCode: unique('positions_code_unique').on(t.code),
    titleIdx: index('positions_title_idx').on(t.title),
  }),
);
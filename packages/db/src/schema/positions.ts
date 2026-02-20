import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    title: varchar('title', { length: 200 }).notNull(),

    level: varchar('level', { length: 100 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    titleIdx: index('positions_title_idx').on(t.title),
  }),
);
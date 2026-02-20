import {
    pgTable,
    uuid,
    date,
    varchar,
    boolean,
    timestamp,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';

export const holidays = pgTable(
    'holidays',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        date: date('date').notNull(),

        name: varchar('name', { length: 150 }).notNull(),

        countryCode: varchar('country_code', { length: 10 })
            .default('PH')
            .notNull(),

        isRecurring: boolean('is_recurring').default(false).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        holidayDateCountryUq: uniqueIndex('holidays_date_country_uq').on(
            t.date,
            t.countryCode,
        ),
        countryIdx: index('holidays_country_idx').on(t.countryCode),
    }),
);

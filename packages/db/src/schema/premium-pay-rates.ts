import {
    pgTable,
    uuid,
    varchar,
    decimal,
    timestamp,
    pgEnum,
    text,
} from 'drizzle-orm/pg-core';

export const premiumPayCategoryEnum = pgEnum('premium_pay_category', [
    'OVERTIME',
    'HOLIDAY',
    'NIGHT_DIFF',
    'REST_DAY',
]);

export const premiumPayRates = pgTable(
    'premium_pay_rates',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        
        // e.g. "ORD_OT", "REG_HOL", "SPE_HOL"
        code: varchar('code', { length: 50 }).notNull().unique(),
        
        // e.g. "Ordinary Overtime", "Regular Holiday Pay"
        name: varchar('name', { length: 250 }).notNull(),

        category: premiumPayCategoryEnum('category').notNull(),

        // Multiplier applied to the basic hourly rate
        // e.g. 1.25, 2.00, 1.10
        multiplier: decimal('multiplier', { precision: 5, scale: 3 }).notNull(),

        description: text('description'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    }
);

export type PremiumPayRate = typeof premiumPayRates.$inferSelect;
export type NewPremiumPayRate = typeof premiumPayRates.$inferInsert;

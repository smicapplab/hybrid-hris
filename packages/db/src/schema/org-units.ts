import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    unique,
    foreignKey,
    index,
} from 'drizzle-orm/pg-core';

// Self-referencing hierarchical organizational unit table
export const orgUnits = pgTable(
    'org_units',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        name: text('name').notNull(),
        code: text('code').notNull(),

        parentId: uuid('parent_id'),

        isActive: boolean('is_active').default(true).notNull(),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        uniqueCode: unique().on(table.code),

        parentIdx: index('org_units_parent_idx').on(table.parentId),

        parentFk: foreignKey({
            columns: [table.parentId],
            foreignColumns: [table.id],
            name: 'org_units_parent_fk',
        }).onDelete('set null'),
    }),
);
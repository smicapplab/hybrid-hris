
import {
    pgTable,
    uuid,
    integer,
    boolean,
    timestamp,
    unique,
    foreignKey,
} from 'drizzle-orm/pg-core';
import { orgUnits } from './org-units';
import { positions } from './positions';

export const orgUnitPositions = pgTable(
    'org_unit_positions',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        orgUnitId: uuid('org_unit_id').notNull(),
        positionId: uuid('position_id').notNull(),

        // Optional headcount control per org unit + position
        headcountLimit: integer('headcount_limit'),

        isActive: boolean('is_active').default(true).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        uniqueOrgUnitPosition: unique('org_unit_position_unique').on(
            t.orgUnitId,
            t.positionId,
        ),

        orgUnitFk: foreignKey({
            columns: [t.orgUnitId],
            foreignColumns: [orgUnits.id],
            name: 'org_unit_positions_org_unit_fk',
        }).onDelete('cascade'),

        positionFk: foreignKey({
            columns: [t.positionId],
            foreignColumns: [positions.id],
            name: 'org_unit_positions_position_fk',
        }).onDelete('cascade'),
    }),
);
import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    uniqueIndex,
    pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const authProviderEnum = pgEnum('auth_provider', ['GOOGLE', 'MICROSOFT']);

export const userIdentities = pgTable(
    'user_identities',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        provider: authProviderEnum('provider').notNull(),

        // The unique ID from the provider (e.g. 'sub' in Google)
        providerId: varchar('provider_id', { length: 255 }).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        providerIdUq: uniqueIndex('user_identities_provider_id_uq').on(t.provider, t.providerId),
    }),
);

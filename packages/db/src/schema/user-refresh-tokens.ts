import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';
import { users } from './users';

export const userRefreshTokens = pgTable(
  'user_refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Hashed refresh token (never store plaintext)
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),

    // JWT ID for rotation tracking
    jti: varchar('jti', { length: 64 }).notNull(),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    revokedAt: timestamp('revoked_at', { withTimezone: true }),

    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: varchar('user_agent', { length: 512 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index('user_refresh_tokens_user_idx').on(t.userId),

    jtiUq: uniqueIndex('user_refresh_tokens_jti_uq').on(t.jti),

    tokenHashIdx: index('user_refresh_tokens_token_hash_idx').on(t.tokenHash),

    notExpiredCheck: check(
      'user_refresh_tokens_not_expired_check',
      sql`expires_at > created_at`,
    ),
  }),
);

export type UserRefreshToken = typeof userRefreshTokens.$inferSelect;
export type NewUserRefreshToken = typeof userRefreshTokens.$inferInsert;

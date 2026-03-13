import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  text,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Action details
    action: varchar('action', { length: 50 }).notNull(), // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    entityType: varchar('entity_type', { length: 100 }).notNull(), // e.g., 'EMPLOYEE', 'SKILL', 'LEAVE'
    entityId: varchar('entity_id', { length: 255 }), // ID of the specific record
    
    // Data changes
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    
    // Context
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'), // Extra context like "Reason for change"
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
} from 'drizzle-orm/pg-core';
import { trainingPrograms } from './training-programs';
import { employees } from './employees';
import { trainingScheduleStatusEnum } from './enums';

export { trainingScheduleStatusEnum };

export const trainingSchedules = pgTable(
  'training_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: 'cascade' }),
    
    status: trainingScheduleStatusEnum('status').default('SCHEDULED').notNull(),
    
    // Internal trainer (if any)
    trainerId: uuid('trainer_id').references(() => employees.id, { onDelete: 'set null' }),
    // External trainer name (if not an employee)
    externalTrainer: varchar('external_trainer', { length: 255 }),
    
    location: varchar('location', { length: 255 }),
    capacity: integer('capacity'),

    // Main range for the entire course instance
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// Support for multi-day schedules (e.g. Session 1, Session 2)
export const trainingScheduleSessions = pgTable(
  'training_schedule_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => trainingSchedules.id, { onDelete: 'cascade' }),
    
    title: varchar('title', { length: 255 }),
    location: varchar('location', { length: 255 }),
    
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

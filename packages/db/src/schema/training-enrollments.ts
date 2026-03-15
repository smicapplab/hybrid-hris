import {
  pgTable,
  uuid,
  timestamp,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { trainingSchedules } from './training-schedules';
import { employees } from './employees';
import { trainingEnrollmentStatusEnum } from './enums';

export { trainingEnrollmentStatusEnum };

export const trainingEnrollments = pgTable(
  'training_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => trainingSchedules.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),

    status: trainingEnrollmentStatusEnum('status').default('ENROLLED').notNull(),
    
    // Notes for attendance or completion
    completionNotes: text('completion_notes'),
    
    // Tracks when they were invited or enrolled
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
    // Tracks when marked as completed/not-attended
    processedAt: timestamp('processed_at', { withTimezone: true }),
    // Who processed the completion
    processedById: uuid('processed_by_id').references(() => employees.id, { onDelete: 'set null' }),

    // Training Evaluation / Feedback
    feedbackRating: text('feedback_rating'), // e.g. 1-5
    feedbackComments: text('feedback_comments'),
    feedbackSubmittedAt: timestamp('feedback_submitted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    employeeIdx: index('training_enrollments_employee_idx').on(t.employeeId),
    // Prevent duplicate enrollment for the same schedule
    scheduleEmployeeUq: uniqueIndex('training_enrollments_schedule_employee_uq').on(
      t.scheduleId,
      t.employeeId
    ),
  })
);

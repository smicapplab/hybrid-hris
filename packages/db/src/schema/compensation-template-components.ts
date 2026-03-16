import {
    pgTable,
    uuid,
    decimal,
    timestamp,
    primaryKey,
} from 'drizzle-orm/pg-core';
import { compensationTemplates } from './compensation-templates';
import { payrollComponents } from './payroll-components';

export const compensationTemplateComponents = pgTable(
    'compensation_template_components',
    {
        templateId: uuid('template_id')
            .notNull()
            .references(() => compensationTemplates.id, { onDelete: 'cascade' }),
            
        payrollComponentId: uuid('payroll_component_id')
            .notNull()
            .references(() => payrollComponents.id, { onDelete: 'cascade' }),
        
        // The default amount for this component in the template
        amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.templateId, t.payrollComponentId] }),
    }),
);

export type CompensationTemplateComponent = typeof compensationTemplateComponents.$inferSelect;
export type NewCompensationTemplateComponent = typeof compensationTemplateComponents.$inferInsert;

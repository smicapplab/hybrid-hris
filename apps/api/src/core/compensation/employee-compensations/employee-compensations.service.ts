import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { employeeCompensations, EmployeeCompensation, payrollComponents, compensationTemplateComponents } from '@hybrid-hris/db';
import { eq, asc, inArray } from 'drizzle-orm';
import { CreateEmployeeCompensationDto } from './dto/create-employee-compensation.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class EmployeeCompensationsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async findByEmployee(employeeId: string) {
        const records = await this.db.db
            .select({
                id: employeeCompensations.id,
                amount: employeeCompensations.amount,
                effectiveFrom: employeeCompensations.effectiveFrom,
                effectiveTo: employeeCompensations.effectiveTo,
                component: {
                    code: payrollComponents.code,
                    name: payrollComponents.name,
                    type: payrollComponents.type,
                }
            })
            .from(employeeCompensations)
            .leftJoin(payrollComponents, eq(employeeCompensations.payrollComponentId, payrollComponents.id))
            .where(eq(employeeCompensations.employeeId, employeeId))
            .orderBy(asc(payrollComponents.name));
        
        return records;
    }

    async create(data: CreateEmployeeCompensationDto, actorId: string): Promise<EmployeeCompensation> {
        const [created] = await this.db.db
            .insert(employeeCompensations)
            .values(data)
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'CREATE',
            entityType: 'EMPLOYEE_COMPENSATION',
            entityId: created.id,
            newValue: created,
        });

        return created;
    }
    
    async applyTemplate(employeeId: string, templateId: string, actorId: string) {
        return this.db.withTransaction(async (tx) => {
            // 1. Get all components for the template
            const templateComponents = await tx
                .select()
                .from(compensationTemplateComponents)
                .where(eq(compensationTemplateComponents.templateId, templateId));

            if (templateComponents.length === 0) {
                // Clear existing if they apply an empty template
                await tx.delete(employeeCompensations).where(eq(employeeCompensations.employeeId, employeeId));
                return;
            }

            // 2. Get existing compensations for this employee
            const existingComps = await tx.select().from(employeeCompensations).where(eq(employeeCompensations.employeeId, employeeId));

            // 3. Create a map of new components
            const newCompMap = new Map(templateComponents.map(c => [c.payrollComponentId, c]));

            const today = new Date().toISOString().slice(0, 10);

            // 4. Upsert logic
            const toInsert = [];
            const toUpdate = [];

            for (const newComp of templateComponents) {
                const existing = existingComps.find(ec => ec.payrollComponentId === newComp.payrollComponentId);
                if (existing) {
                    // If it exists but amount is different, update it
                    if (existing.amount !== newComp.amount) {
                        toUpdate.push(
                            tx.update(employeeCompensations)
                                .set({ amount: newComp.amount, updatedAt: new Date() })
                                .where(eq(employeeCompensations.id, existing.id))
                        );
                    }
                } else {
                    // If it doesn't exist, add it
                    toInsert.push({
                        employeeId,
                        payrollComponentId: newComp.payrollComponentId,
                        amount: newComp.amount,
                        effectiveFrom: today,
                    });
                }
            }

            // 5. To remove: existing comps that are NOT in the new template
            const toRemove = existingComps.filter(ec => !newCompMap.has(ec.payrollComponentId));
            if (toRemove.length > 0) {
                await tx.delete(employeeCompensations).where(inArray(employeeCompensations.id, toRemove.map(r => r.id)));
            }

            if (toInsert.length > 0) await tx.insert(employeeCompensations).values(toInsert);
            if (toUpdate.length > 0) await Promise.all(toUpdate);

            await this.auditService.log({
                userId: actorId,
                action: 'APPLY_COMPENSATION_TEMPLATE',
                entityType: 'EMPLOYEE',
                entityId: employeeId,
                newValue: { templateId },
            });
        });
    }

    async update(id: string, data: Partial<CreateEmployeeCompensationDto>, actorId: string): Promise<EmployeeCompensation> {
        const [existing] = await this.db.db.select().from(employeeCompensations).where(eq(employeeCompensations.id, id));
        if (!existing) throw new NotFoundException('Compensation record not found');

        const [updated] = await this.db.db
            .update(employeeCompensations)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(employeeCompensations.id, id))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'UPDATE',
            entityType: 'EMPLOYEE_COMPENSATION',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        });

        return updated;
    }

    async remove(id: string, actorId: string): Promise<void> {
        const [existing] = await this.db.db.select().from(employeeCompensations).where(eq(employeeCompensations.id, id));
        if (!existing) throw new NotFoundException('Compensation record not found');

        await this.db.db.delete(employeeCompensations).where(eq(employeeCompensations.id, id));

        await this.auditService.log({
            userId: actorId,
            action: 'DELETE',
            entityType: 'EMPLOYEE_COMPENSATION',
            entityId: id,
            oldValue: existing,
        });
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { and, eq, isNull, inArray } from 'drizzle-orm';
import { compensationTemplates, compensationTemplateComponents, payrollComponents } from '@hybrid-hris/db';
import { CreateCompensationTemplateDto } from './dto/create-compensation-template.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class CompensationTemplatesService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async findAll() {
        const templates = await this.db.db.select().from(compensationTemplates).where(isNull(compensationTemplates.deletedAt));
        if (templates.length === 0) return [];

        const templateIds = templates.map(t => t.id);
        const allComponents = await this.db.db
            .select()
            .from(compensationTemplateComponents)
            .where(inArray(compensationTemplateComponents.templateId, templateIds));
        
        return templates.map(t => ({
            ...t,
            components: allComponents.filter(c => c.templateId === t.id),
        }));
    }

    async findOne(id: string) {
        const [template] = await this.db.db.select().from(compensationTemplates).where(eq(compensationTemplates.id, id));
        if (!template) throw new NotFoundException('Template not found');

        const components = await this.db.db
            .select({
                payrollComponentId: compensationTemplateComponents.payrollComponentId,
                amount: compensationTemplateComponents.amount,
                name: payrollComponents.name,
                code: payrollComponents.code,
            })
            .from(compensationTemplateComponents)
            .innerJoin(payrollComponents, eq(compensationTemplateComponents.payrollComponentId, payrollComponents.id))
            .where(eq(compensationTemplateComponents.templateId, id));

        return { ...template, components };
    }

    async findByJobLevel(jobLevelId: string) {
        const [template] = await this.db.db
            .select()
            .from(compensationTemplates)
            .where(and(
                eq(compensationTemplates.jobLevelId, jobLevelId),
                isNull(compensationTemplates.deletedAt)
            ))
            .limit(1);

        if (!template) return null;

        const components = await this.db.db
            .select({
                payrollComponentId: compensationTemplateComponents.payrollComponentId,
                amount: compensationTemplateComponents.amount,
                name: payrollComponents.name,
                code: payrollComponents.code,
            })
            .from(compensationTemplateComponents)
            .innerJoin(payrollComponents, eq(compensationTemplateComponents.payrollComponentId, payrollComponents.id))
            .where(eq(compensationTemplateComponents.templateId, template.id));

        return { ...template, components };
    }

    async create(dto: CreateCompensationTemplateDto, actorId: string) {
        return this.db.withTransaction(async (tx) => {
            const [template] = await tx.insert(compensationTemplates).values({
                code: dto.code,
                name: dto.name,
                description: dto.description,
                jobLevelId: dto.jobLevelId,
            }).returning();

            const componentValues = dto.components.map(c => ({
                templateId: template.id,
                payrollComponentId: c.payrollComponentId,
                amount: c.amount,
            }));

            await tx.insert(compensationTemplateComponents).values(componentValues);

            await this.auditService.log({
                userId: actorId,
                action: 'CREATE',
                entityType: 'COMPENSATION_TEMPLATE',
                entityId: template.id,
                newValue: { ...template, components: dto.components },
            });

            return template;
        });
    }

    async update(id: string, dto: Partial<CreateCompensationTemplateDto>, actorId: string) {
        return this.db.withTransaction(async (tx) => {
            const [existing] = await tx.select().from(compensationTemplates).where(eq(compensationTemplates.id, id));
            if (!existing) throw new NotFoundException('Template not found');

            const [template] = await tx.update(compensationTemplates).set({
                code: dto.code,
                name: dto.name,
                description: dto.description,
                jobLevelId: dto.jobLevelId,
                updatedAt: new Date(),
            }).where(eq(compensationTemplates.id, id)).returning();

            if (dto.components) {
                await tx.delete(compensationTemplateComponents).where(eq(compensationTemplateComponents.templateId, id));
                
                const componentValues = dto.components.map(c => ({
                    templateId: template.id,
                    payrollComponentId: c.payrollComponentId,
                    amount: c.amount,
                }));
                await tx.insert(compensationTemplateComponents).values(componentValues);
            }

            await this.auditService.log({
                userId: actorId,
                action: 'UPDATE',
                entityType: 'COMPENSATION_TEMPLATE',
                entityId: id,
                newValue: { ...template, components: dto.components },
            });

            return template;
        });
    }

    async remove(id: string, actorId: string) {
        const [existing] = await this.db.db.select().from(compensationTemplates).where(eq(compensationTemplates.id, id));
        if (!existing) throw new NotFoundException('Template not found');

        await this.db.db.update(compensationTemplates).set({ deletedAt: new Date() }).where(eq(compensationTemplates.id, id));

        await this.auditService.log({
            userId: actorId,
            action: 'DELETE',
            entityType: 'COMPENSATION_TEMPLATE',
            entityId: id,
            oldValue: existing,
        });
    }
}

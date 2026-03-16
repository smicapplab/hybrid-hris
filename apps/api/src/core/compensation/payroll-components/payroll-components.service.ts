import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { payrollComponents, PayrollComponent } from '@hybrid-hris/db';
import { and, eq, isNull, asc } from 'drizzle-orm';
import { CreatePayrollComponentDto } from './dto/create-payroll-component.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class PayrollComponentsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async findAll(): Promise<PayrollComponent[]> {
        return this.db.db
            .select()
            .from(payrollComponents)
            .where(isNull(payrollComponents.deletedAt))
            .orderBy(asc(payrollComponents.name));
    }

    async findById(id: string): Promise<PayrollComponent> {
        const [row] = await this.db.db
            .select()
            .from(payrollComponents)
            .where(and(eq(payrollComponents.id, id), isNull(payrollComponents.deletedAt)))
            .limit(1);

        if (!row) throw new NotFoundException('Payroll component not found');
        return row;
    }

    async create(data: CreatePayrollComponentDto, actorId: string): Promise<PayrollComponent> {
        const [existing] = await this.db.db
            .select()
            .from(payrollComponents)
            .where(and(eq(payrollComponents.code, data.code), isNull(payrollComponents.deletedAt)))
            .limit(1);

        if (existing) throw new ConflictException('Payroll component code already exists');

        const [created] = await this.db.db
            .insert(payrollComponents)
            .values(data)
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'CREATE',
            entityType: 'PAYROLL_COMPONENT',
            entityId: created.id,
            newValue: created,
        });

        return created;
    }

    async update(id: string, data: Partial<CreatePayrollComponentDto>, actorId: string): Promise<PayrollComponent> {
        const existing = await this.findById(id);

        const [updated] = await this.db.db
            .update(payrollComponents)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(payrollComponents.id, id))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'UPDATE',
            entityType: 'PAYROLL_COMPONENT',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        });

        return updated;
    }

    async remove(id: string, actorId: string): Promise<void> {
        const existing = await this.findById(id);

        const [updated] = await this.db.db
            .update(payrollComponents)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(payrollComponents.id, id))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'DELETE',
            entityType: 'PAYROLL_COMPONENT',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        });
    }
}

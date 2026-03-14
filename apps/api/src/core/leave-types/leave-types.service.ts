import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { leaveTypes } from '@hybrid-hris/db/schema'
import { and, eq, ilike, isNull, isNotNull, or, asc } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class LeaveTypesService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async getAll(filters?: {
        search?: string
        includeDeleted?: boolean
    }) {
        const conditions = []

        if (!filters?.includeDeleted) {
            conditions.push(isNull(leaveTypes.deletedAt))
        }

        if (filters?.search) {
            conditions.push(
                or(
                    ilike(leaveTypes.name, `%${filters.search}%`),
                    ilike(leaveTypes.code, `%${filters.search}%`),
                ),
            )
        }

        const query = this.db.db
            .select({
                id: leaveTypes.id,
                code: leaveTypes.code,
                name: leaveTypes.name,
                description: leaveTypes.description,
                isAccrualBased: leaveTypes.isAccrualBased,
                isPaid: leaveTypes.isPaid,
                accrualRatePerMonth: leaveTypes.accrualRatePerMonth,
                maxCarryOver: leaveTypes.maxCarryOver,
                deletedAt: leaveTypes.deletedAt,
                createdAt: leaveTypes.createdAt,
                updatedAt: leaveTypes.updatedAt,
            })
            .from(leaveTypes)
            .orderBy(asc(leaveTypes.name))

        if (conditions.length > 0) {
            return query.where(and(...conditions))
        }

        return query
    }

    async getById(id: string) {
        const result = await this.db.db
            .select()
            .from(leaveTypes)
            .where(eq(leaveTypes.id, id))
            .limit(1)

        if (!result.length) {
            throw new NotFoundException('Leave type not found')
        }

        return result[0]
    }

    async create(data: {
        code: string
        name: string
        description?: string
        isAccrualBased?: boolean
        isPaid?: boolean
        accrualRatePerMonth?: string
        maxCarryOver?: string
    }, actorId: string) {
        const existing = await this.db.db
            .select({ id: leaveTypes.id })
            .from(leaveTypes)
            .where(eq(leaveTypes.code, data.code))
            .limit(1)

        if (existing.length) {
            throw new ConflictException(`Leave type with code '${data.code}' already exists`)
        }

        const [inserted] = await this.db.db
            .insert(leaveTypes)
            .values({
                code: data.code,
                name: data.name,
                description: data.description ?? null,
                isAccrualBased: data.isAccrualBased ?? true,
                isPaid: data.isPaid ?? true,
                accrualRatePerMonth: data.accrualRatePerMonth ?? null,
                maxCarryOver: data.maxCarryOver ?? null,
            })
            .returning()

        await this.auditService.log({
            userId: actorId,
            action: 'CREATE',
            entityType: 'LeaveType',
            entityId: inserted.id,
            newValue: inserted,
        });

        return inserted
    }

    async update(
        id: string,
        data: {
            code?: string
            name?: string
            description?: string
            isAccrualBased?: boolean
            isPaid?: boolean
            accrualRatePerMonth?: string | null
            maxCarryOver?: string | null
        },
        actorId: string,
    ) {
        const existing = await this.getById(id)

        if (data.code && data.code !== existing.code) {
            const conflict = await this.db.db
                .select({ id: leaveTypes.id })
                .from(leaveTypes)
                .where(eq(leaveTypes.code, data.code))
                .limit(1)

            if (conflict.length) {
                throw new ConflictException(`Leave type with code '${data.code}' already exists`)
            }
        }

        const [updated] = await this.db.db
            .update(leaveTypes)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(leaveTypes.id, existing.id))
            .returning()

        await this.auditService.log({
            userId: actorId,
            action: 'UPDATE',
            entityType: 'LeaveType',
            entityId: updated.id,
            oldValue: existing,
            newValue: updated,
        });

        return updated
    }

    async softDelete(id: string, actorId: string) {
        const existing = await this.getById(id)

        await this.db.db
            .update(leaveTypes)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(leaveTypes.id, existing.id))

        await this.auditService.log({
            userId: actorId,
            action: 'DELETE',
            entityType: 'LeaveType',
            entityId: id,
            oldValue: existing,
        });

        return { success: true }
    }

    async restore(id: string, actorId: string) {
        const result = await this.db.db
            .select()
            .from(leaveTypes)
            .where(and(eq(leaveTypes.id, id), isNotNull(leaveTypes.deletedAt)))
            .limit(1)

        if (!result.length) {
            throw new NotFoundException('Deleted leave type not found')
        }

        const existing = result[0];

        const [restored] = await this.db.db
            .update(leaveTypes)
            .set({ deletedAt: null, updatedAt: new Date() })
            .where(eq(leaveTypes.id, id))
            .returning()

        await this.auditService.log({
            userId: actorId,
            action: 'RESTORE',
            entityType: 'LeaveType',
            entityId: id,
            oldValue: existing,
            newValue: restored,
        });

        return { success: true }
    }
}

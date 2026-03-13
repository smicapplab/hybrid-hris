import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { positions, employees } from '@hybrid-hris/db/schema'
import { and, eq, ilike, asc, or, sql } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class PositionsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async getAll(filters?: {
        active?: boolean
        code?: string
        title?: string
        search?: string
    }) {
        const conditions = []

        if (filters?.active === true) {
            conditions.push(eq(positions.isActive, true))
        }

        if (filters?.code) {
            conditions.push(ilike(positions.code, `%${filters.code}%`))
        }

        if (filters?.title) {
            conditions.push(ilike(positions.title, `%${filters.title}%`))
        }

        if (filters?.search) {
            conditions.push(
                or(
                    ilike(positions.title, `%${filters.search}%`),
                    ilike(positions.code, `%${filters.search}%`),
                ),
            )
        }

        const query = this.db.db
            .select({
                id: positions.id,
                code: positions.code,
                title: positions.title,
                description: positions.description,
                isActive: positions.isActive,
                createdAt: positions.createdAt,
                updatedAt: positions.updatedAt,
                isDeletable: sql<boolean>`
    CASE 
        WHEN COUNT(${employees.id}) = 0 
            AND ${positions.isActive} = true
        THEN true
        ELSE false
    END
`.as('isDeletable'),
            })
            .from(positions)
            .leftJoin(employees, eq(employees.positionId, positions.id))
            .groupBy(
                positions.id,
                positions.code,
                positions.title,
                positions.description,
                positions.isActive,
                positions.createdAt,
                positions.updatedAt,
            )
            .orderBy(asc(positions.title))

        if (conditions.length > 0) {
            return query.where(and(...conditions))
        }

        return query
    }

    async getById(id: string) {
        const result = await this.db.db
            .select()
            .from(positions)
            .where(eq(positions.id, id))
            .limit(1)

        if (!result.length) {
            throw new NotFoundException('Position not found')
        }

        return result[0]
    }

    async create(
        data: {
            code: string
            title: string
            description?: string
        },
        actorId?: string,
    ) {
        const inserted = await this.db.db
            .insert(positions)
            .values({
                code: data.code,
                title: data.title,
                description: data.description ?? null,
                isActive: true,
            })
            .returning()

        const result = inserted[0]

        if (actorId && result) {
            await this.auditService.log({
                userId: actorId,
                action: 'CREATE',
                entityType: 'POSITION',
                entityId: result.id,
                newValue: result,
            })
        }

        return result
    }

    async update(
        id: string,
        data: {
            code?: string
            title?: string
            description?: string
            isActive?: boolean
        },
        actorId?: string,
    ) {
        const existing = await this.getById(id)

        const updated = await this.db.db
            .update(positions)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(positions.id, existing.id))
            .returning()

        const result = updated[0]

        if (actorId && result) {
            await this.auditService.log({
                userId: actorId,
                action: 'UPDATE',
                entityType: 'POSITION',
                entityId: id,
                oldValue: existing,
                newValue: result,
            })
        }

        return result
    }

    async softDelete(id: string, actorId?: string) {
        const existing = await this.getById(id)

        const updated = await this.db.db
            .update(positions)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(positions.id, existing.id))
            .returning()

        const result = updated[0]

        if (actorId && result) {
            await this.auditService.log({
                userId: actorId,
                action: 'DELETE',
                entityType: 'POSITION',
                entityId: id,
                oldValue: existing,
                newValue: result,
            })
        }

        return { success: true }
    }

    async restore(id: string, actorId?: string) {
        const existing = await this.getById(id)

        const updated = await this.db.db
            .update(positions)
            .set({
                isActive: true,
                updatedAt: new Date(),
            })
            .where(eq(positions.id, existing.id))
            .returning()

        const result = updated[0]

        if (actorId && result) {
            await this.auditService.log({
                userId: actorId,
                action: 'UPDATE',
                entityType: 'POSITION',
                entityId: id,
                oldValue: existing,
                newValue: result,
                metadata: { action: 'RESTORE' }
            })
        }

        return { success: true }
    }
}
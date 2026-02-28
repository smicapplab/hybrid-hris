

import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { and, eq, isNull } from 'drizzle-orm'
import { shiftTemplates } from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto'
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto'

@Injectable()
export class ShiftTemplatesService {
    constructor(private readonly db: DatabaseService) { }

    async findAll() {
        return this.db.db
            .select()
            .from(shiftTemplates)
            .where(isNull(shiftTemplates.deletedAt))
            .orderBy(shiftTemplates.name)
    }

    async findById(id: string) {
        const [row] = await this.db.db
            .select()
            .from(shiftTemplates)
            .where(eq(shiftTemplates.id, id))
            .limit(1)

        if (!row || row.deletedAt) {
            throw new NotFoundException('Shift template not found')
        }

        return row
    }

    async create(payload: CreateShiftTemplateDto) {
        if (!payload.code || !payload.name) {
            throw new BadRequestException('Code and name are required')
        }

        // Only check against active (non-deleted) templates — the partial unique index
        // allows a previously soft-deleted code to be reused.
        const [existing] = await this.db.db
            .select({ id: shiftTemplates.id })
            .from(shiftTemplates)
            .where(and(eq(shiftTemplates.code, payload.code), isNull(shiftTemplates.deletedAt)))
            .limit(1)

        if (existing) {
            throw new BadRequestException('Shift template code already exists')
        }

        try {
            const [created] = await this.db.db
                .insert(shiftTemplates)
                .values({ ...payload })
                .returning()

            return created
        } catch (err: any) {
            if (err?.code === '23505') {
                throw new BadRequestException('Shift template code already exists')
            }
            throw err
        }
    }

    async update(
        id: string,
        payload: UpdateShiftTemplateDto,
    ) {
        const [existing] = await this.db.db
            .select()
            .from(shiftTemplates)
            .where(eq(shiftTemplates.id, id))
            .limit(1)

        if (!existing || existing.deletedAt) {
            throw new NotFoundException('Shift template not found')
        }

        const allowedFields: (keyof UpdateShiftTemplateDto)[] = [
            'name', 'startTime', 'endTime', 'breakMinutes', 'isFlexible', 'isActive',
            'isMon', 'isTue', 'isWed', 'isThu', 'isFri', 'isSat', 'isSun',
        ]

        const patch: Record<string, unknown> = { updatedAt: new Date() }
        for (const field of allowedFields) {
            if (payload[field] !== undefined) {
                patch[field] = payload[field]
            }
        }

        if (Object.keys(patch).length === 1) {
            // only updatedAt — nothing to change
            throw new BadRequestException('No updatable fields provided')
        }

        const [updated] = await this.db.db
            .update(shiftTemplates)
            .set(patch)
            .where(eq(shiftTemplates.id, id))
            .returning()

        return updated
    }

    async softDelete(id: string) {
        const [existing] = await this.db.db
            .select()
            .from(shiftTemplates)
            .where(eq(shiftTemplates.id, id))
            .limit(1)

        if (!existing || existing.deletedAt) {
            throw new NotFoundException('Shift template not found')
        }

        const [updated] = await this.db.db
            .update(shiftTemplates)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(shiftTemplates.id, id))
            .returning()

        return updated
    }
}

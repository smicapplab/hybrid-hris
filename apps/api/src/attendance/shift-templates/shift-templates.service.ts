

import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { eq, isNull } from 'drizzle-orm'
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

        const [existing] = await this.db.db
            .select({ id: shiftTemplates.id })
            .from(shiftTemplates)
            .where(eq(shiftTemplates.code, payload.code))
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

        const updatePayload = {
            ...payload,
            updatedAt: new Date(),
        }

        const [updated] = await this.db.db
            .update(shiftTemplates)
            .set(updatePayload)
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

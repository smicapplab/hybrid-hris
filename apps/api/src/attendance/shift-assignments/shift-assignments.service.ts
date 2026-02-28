import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { and, eq, gte, isNull, lte, or } from 'drizzle-orm'
import {
    employeeShiftAssignments,
    shiftTemplates,
} from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto'
import { UpdateShiftAssignmentDto } from './dto/update-shift-assignment.dto'

@Injectable()
export class ShiftAssignmentsService {
    constructor(private readonly db: DatabaseService) { }

    async findAllByEmployee(employeeId: string) {
        return this.db.db
            .select()
            .from(employeeShiftAssignments)
            .where(
                and(
                    eq(employeeShiftAssignments.employeeId, employeeId),
                    isNull(employeeShiftAssignments.deletedAt),
                ),
            )
    }

    async findActiveForDate(employeeId: string, workDate: string) {
        const [row] = await this.db.db
            .select()
            .from(employeeShiftAssignments)
            .where(
                and(
                    eq(employeeShiftAssignments.employeeId, employeeId),
                    lte(employeeShiftAssignments.effectiveFrom, workDate),
                    or(
                        isNull(employeeShiftAssignments.effectiveTo),
                        gte(employeeShiftAssignments.effectiveTo, workDate),
                    ),
                    isNull(employeeShiftAssignments.deletedAt),
                ),
            )
            .limit(1)

        return row ?? null
    }

    async create(payload: CreateShiftAssignmentDto) {
        return this.db.withTransaction(async (tx) => {
            const [template] = await tx
                .select()
                .from(shiftTemplates)
                .where(eq(shiftTemplates.id, payload.shiftTemplateId))
                .limit(1)

            if (!template || template.deletedAt) {
                throw new NotFoundException('Shift template not found')
            }

            if (!template.isActive) {
                throw new BadRequestException('Shift template is not active')
            }

            const startTime = payload.override?.startTime ?? template.startTime
            const endTime = payload.override?.endTime ?? template.endTime
            const breakMinutes =
                payload.override?.breakMinutes ?? template.breakMinutes
            const isFlexible =
                payload.override?.isFlexible ?? template.isFlexible

            const [created] = await tx
                .insert(employeeShiftAssignments)
                .values({
                    employeeId: payload.employeeId,
                    shiftTemplateId: template.id,
                    startTime,
                    endTime,
                    breakMinutes,
                    isFlexible,
                    effectiveFrom: payload.effectiveFrom,
                    effectiveTo: payload.effectiveTo ?? null,
                })
                .returning()

            return created
        })
    }

    async update(id: string, payload: UpdateShiftAssignmentDto) {
        const [existing] = await this.db.db
            .select()
            .from(employeeShiftAssignments)
            .where(eq(employeeShiftAssignments.id, id))
            .limit(1)

        if (!existing || existing.deletedAt) {
            throw new NotFoundException('Shift assignment not found')
        }

        const [updated] = await this.db.db
            .update(employeeShiftAssignments)
            .set({
                ...payload,
                updatedAt: new Date(),
            })
            .where(eq(employeeShiftAssignments.id, id))
            .returning()

        return updated
    }

    async softDelete(id: string) {
        const [existing] = await this.db.db
            .select()
            .from(employeeShiftAssignments)
            .where(eq(employeeShiftAssignments.id, id))
            .limit(1)

        if (!existing || existing.deletedAt) {
            throw new NotFoundException('Shift assignment not found')
        }

        const [updated] = await this.db.db
            .update(employeeShiftAssignments)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(employeeShiftAssignments.id, id))
            .returning()

        return updated
    }
}

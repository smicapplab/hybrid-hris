import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { and, eq, lte, SQL } from 'drizzle-orm'
import {
    pendingEmployeeShiftAssignments,
    employeeShiftAssignments,
    shiftTemplates,
    employees,
    PendingEmployeeShiftAssignment,
    NewPendingEmployeeShiftAssignment,
} from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import { CreateShiftAssignmentDto } from '../shift-assignments/dto/create-shift-assignment.dto'
import { AuditService } from '../../core/audit/audit.service'

@Injectable()
export class PendingShiftAssignmentsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async findAll(status?: 'PENDING' | 'APPLIED' | 'CANCELLED') {
        const clauses: SQL[] = []
        if (status) {
            clauses.push(eq(pendingEmployeeShiftAssignments.status, status))
        }

        const result = await this.db.db
            .select({
                pending: pendingEmployeeShiftAssignments,
                employee: {
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    employeeNo: employees.employeeNo,
                }
            })
            .from(pendingEmployeeShiftAssignments)
            .leftJoin(employees, eq(pendingEmployeeShiftAssignments.employeeId, employees.id))
            .where(and(...clauses))
            .orderBy(pendingEmployeeShiftAssignments.effectiveDate)

        // Drizzle doesn't have a clean way to type this join, so we map it
        return result.map(r => ({
            ...r.pending,
            employee: r.employee,
        }))
    }

    async findByEmployee(employeeId: string, status?: 'PENDING' | 'APPLIED' | 'CANCELLED'): Promise<PendingEmployeeShiftAssignment[]> {
        const clauses: SQL[] = [eq(pendingEmployeeShiftAssignments.employeeId, employeeId)]
        if (status) {
            clauses.push(eq(pendingEmployeeShiftAssignments.status, status))
        }

        return this.db.db
            .select()
            .from(pendingEmployeeShiftAssignments)
            .where(and(...clauses))
            .orderBy(pendingEmployeeShiftAssignments.effectiveDate)
    }

    /**
     * Queue a future-dated shift change.
     * Only one PENDING change allowed per employee.
     */
    async create(payload: CreateShiftAssignmentDto, actorId: string): Promise<PendingEmployeeShiftAssignment> {
        return this.db.withTransaction(async (tx) => {
            // 1. Check if there's already a pending change
            const [existingPending] = await tx
                .select()
                .from(pendingEmployeeShiftAssignments)
                .where(
                    and(
                        eq(pendingEmployeeShiftAssignments.employeeId, payload.employeeId),
                        eq(pendingEmployeeShiftAssignments.status, 'PENDING'),
                    ),
                )
                .limit(1)

            if (existingPending) {
                throw new BadRequestException('This employee already has a pending schedule change.')
            }

            // 2. Fetch template for snapshotting
            const [template] = await tx
                .select()
                .from(shiftTemplates)
                .where(eq(shiftTemplates.id, payload.shiftTemplateId))
                .limit(1)

            if (!template || template.deletedAt) {
                throw new NotFoundException('Shift template not found')
            }

            const ov = payload.override ?? {}
            const values: NewPendingEmployeeShiftAssignment = {
                employeeId: payload.employeeId,
                shiftTemplateId: template.id,
                startTime: ov.startTime ?? template.startTime,
                endTime: ov.endTime ?? template.endTime,
                breakMinutes: ov.breakMinutes ?? template.breakMinutes,
                isFlexible: ov.isFlexible ?? template.isFlexible,
                isMon: ov.isMon ?? template.isMon,
                isTue: ov.isTue ?? template.isTue,
                isWed: ov.isWed ?? template.isWed,
                isThu: ov.isThu ?? template.isThu,
                isFri: ov.isFri ?? template.isFri,
                isSat: ov.isSat ?? template.isSat,
                isSun: ov.isSun ?? template.isSun,
                effectiveDate: payload.effectiveFrom,
                status: 'PENDING',
                requestedBy: actorId,
            }

            const [created] = await tx
                .insert(pendingEmployeeShiftAssignments)
                .values(values)
                .returning()

            await this.auditService.log({
                userId: actorId,
                action: 'CREATE',
                entityType: 'PendingShiftAssignment',
                entityId: created.id,
                newValue: created,
            })

            return created
        })
    }

    async cancel(id: string, actorId: string): Promise<PendingEmployeeShiftAssignment> {
        const [existing] = await this.db.db
            .select()
            .from(pendingEmployeeShiftAssignments)
            .where(eq(pendingEmployeeShiftAssignments.id, id))
            .limit(1)

        if (!existing) throw new NotFoundException('Pending shift not found')
        if (existing.status !== 'PENDING') {
            throw new BadRequestException(`Cannot cancel a shift with status ${existing.status}`)
        }

        const [updated] = await this.db.db
            .update(pendingEmployeeShiftAssignments)
            .set({ status: 'CANCELLED', updatedAt: new Date() })
            .where(eq(pendingEmployeeShiftAssignments.id, id))
            .returning()

        await this.auditService.log({
            userId: actorId,
            action: 'CANCEL',
            entityType: 'PendingShiftAssignment',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        })

        return updated
    }

    /**
     * Finds all pending assignments whose effective date has arrived and applies them.
     */
    async applyAllReady(): Promise<{ count: number }> {
        const today = new Date().toISOString().split('T')[0]!
        const ready = await this.db.db
            .select({ id: pendingEmployeeShiftAssignments.id, employeeId: pendingEmployeeShiftAssignments.employeeId })
            .from(pendingEmployeeShiftAssignments)
            .where(
                and(
                    eq(pendingEmployeeShiftAssignments.status, 'PENDING'),
                    lte(pendingEmployeeShiftAssignments.effectiveDate, today),
                ),
            )

        if (ready.length === 0) return { count: 0 }

        for (const item of ready) {
            await this.applyPendingForEmployee(item.employeeId, today)
        }

        return { count: ready.length }
    }

    /**
     * Promotes pending assignments to active if their effective date has arrived.
     */
    async applyPendingForEmployee(employeeId: string, date: string): Promise<void> {
        await this.db.withTransaction(async (tx) => {
            const [pending] = await tx
                .select()
                .from(pendingEmployeeShiftAssignments)
                .where(
                    and(
                        eq(pendingEmployeeShiftAssignments.employeeId, employeeId),
                        eq(pendingEmployeeShiftAssignments.status, 'PENDING'),
                        lte(pendingEmployeeShiftAssignments.effectiveDate, date),
                    ),
                )
                .limit(1)

            if (!pending) return

            // Upsert into active assignments
            await tx
                .insert(employeeShiftAssignments)
                .values({
                    employeeId: pending.employeeId,
                    shiftTemplateId: pending.shiftTemplateId,
                    startTime: pending.startTime,
                    endTime: pending.endTime,
                    breakMinutes: pending.breakMinutes,
                    isFlexible: pending.isFlexible,
                    isMon: pending.isMon,
                    isTue: pending.isTue,
                    isWed: pending.isWed,
                    isThu: pending.isThu,
                    isFri: pending.isFri,
                    isSat: pending.isSat,
                    isSun: pending.isSun,
                    effectiveFrom: pending.effectiveDate,
                })
                .onConflictDoUpdate({
                    target: employeeShiftAssignments.employeeId,
                    set: {
                        shiftTemplateId: pending.shiftTemplateId,
                        startTime: pending.startTime,
                        endTime: pending.endTime,
                        breakMinutes: pending.breakMinutes,
                        isFlexible: pending.isFlexible,
                        isMon: pending.isMon,
                        isTue: pending.isTue,
                        isWed: pending.isWed,
                        isThu: pending.isThu,
                        isFri: pending.isFri,
                        isSat: pending.isSat,
                        isSun: pending.isSun,
                        effectiveFrom: pending.effectiveDate,
                        updatedAt: new Date(),
                    },
                })

            // Mark pending as applied
            await tx
                .update(pendingEmployeeShiftAssignments)
                .set({ 
                    status: 'APPLIED', 
                    appliedAt: new Date(),
                    updatedAt: new Date() 
                })
                .where(eq(pendingEmployeeShiftAssignments.id, pending.id))
        })
    }
}

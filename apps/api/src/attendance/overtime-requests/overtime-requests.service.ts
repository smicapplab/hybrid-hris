import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { overtimeRequests, employees } from '@hybrid-hris/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { AuditService } from 'src/core/audit/audit.service';
import { CreateOvertimeRequestDto } from './dto/create-overtime-request.dto';
import { OvertimeStatus } from '@hybrid-hris/domain';

@Injectable()
export class OvertimeRequestsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async createRequest(employeeId: string, dto: CreateOvertimeRequestDto, actorId: string) {
        const [inserted] = await this.db.db.insert(overtimeRequests).values({
            employeeId,
            date: new Date(dto.date),
            hours: dto.hours.toString(),
            type: dto.type,
            reason: dto.reason,
            status: 'PENDING',
        }).returning();

        await this.auditService.log({
            userId: actorId,
            action: 'CREATE',
            entityType: 'OvertimeRequest',
            entityId: inserted.id,
            newValue: inserted,
        });

        return inserted;
    }

    async findAll(filters: { status?: OvertimeStatus; employeeId?: string } = {}) {
        const conditions = [];
        if (filters.status) conditions.push(eq(overtimeRequests.status, filters.status));
        if (filters.employeeId) conditions.push(eq(overtimeRequests.employeeId, filters.employeeId));

        return this.db.db
            .select({
                request: overtimeRequests,
                employee: {
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    employeeNo: employees.employeeNo
                }
            })
            .from(overtimeRequests)
            .innerJoin(employees, eq(employees.id, overtimeRequests.employeeId))
            .where(and(...conditions))
            .orderBy(desc(overtimeRequests.createdAt));
    }

    async findEmployeeRequests(employeeId: string) {
        return this.db.db
            .select()
            .from(overtimeRequests)
            .where(eq(overtimeRequests.employeeId, employeeId))
            .orderBy(desc(overtimeRequests.date));
    }

    async processRequest(id: string, status: 'APPROVED' | 'REJECTED', approverId: string, rejectionReason?: string, actorId?: string) {
        const [existing] = await this.db.db
            .select()
            .from(overtimeRequests)
            .where(eq(overtimeRequests.id, id))
            .limit(1);

        if (!existing) throw new NotFoundException('Overtime request not found');
        if (existing.status !== 'PENDING') throw new BadRequestException('Only pending requests can be processed');

        const [updated] = await this.db.db
            .update(overtimeRequests)
            .set({
                status,
                approverId,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null,
                approvedAt: status === 'APPROVED' ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(overtimeRequests.id, id))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'PROCESS',
            entityType: 'OvertimeRequest',
            entityId: id,
            oldValue: existing,
            newValue: updated,
            metadata: { status, rejectionReason }
        });

        return updated;
    }
}

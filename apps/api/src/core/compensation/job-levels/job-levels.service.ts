import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { jobLevels, JobLevel } from '@hybrid-hris/db';
import { and, eq, isNull, asc } from 'drizzle-orm';
import { CreateJobLevelDto } from './dto/create-job-level.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class JobLevelsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async findAll(): Promise<JobLevel[]> {
        return this.db.db
            .select()
            .from(jobLevels)
            .where(isNull(jobLevels.deletedAt))
            .orderBy(asc(jobLevels.rankOrder));
    }

    async findById(id: string): Promise<JobLevel> {
        const [row] = await this.db.db
            .select()
            .from(jobLevels)
            .where(and(eq(jobLevels.id, id), isNull(jobLevels.deletedAt)))
            .limit(1);

        if (!row) throw new NotFoundException('Job level not found');
        return row;
    }

    async create(data: CreateJobLevelDto, actorId: string): Promise<JobLevel> {
        const [existing] = await this.db.db
            .select()
            .from(jobLevels)
            .where(and(eq(jobLevels.code, data.code), isNull(jobLevels.deletedAt)))
            .limit(1);

        if (existing) throw new ConflictException('Job level code already exists');

        const [created] = await this.db.db
            .insert(jobLevels)
            .values(data)
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'CREATE',
            entityType: 'JOB_LEVEL',
            entityId: created.id,
            newValue: created,
        });

        return created;
    }

    async update(id: string, data: Partial<CreateJobLevelDto>, actorId: string): Promise<JobLevel> {
        const existing = await this.findById(id);

        const [updated] = await this.db.db
            .update(jobLevels)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(jobLevels.id, id))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'UPDATE',
            entityType: 'JOB_LEVEL',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        });

        return updated;
    }

    async remove(id: string, actorId: string): Promise<void> {
        const existing = await this.findById(id);

        const [updated] = await this.db.db
            .update(jobLevels)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(jobLevels.id, id))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'DELETE',
            entityType: 'JOB_LEVEL',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        });
    }
}

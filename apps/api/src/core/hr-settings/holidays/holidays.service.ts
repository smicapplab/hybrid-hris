import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { holidays } from '@hybrid-hris/db/schema';
import { eq, and, sql, asc, isNull } from 'drizzle-orm';
import { AuditService } from '../../audit/audit.service';
import { AutomationService } from '../../automation/automation.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidaysService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
        @Inject(forwardRef(() => AutomationService))
        private readonly automationService: AutomationService,
    ) { }

    async findAll(year?: number) {
        let query = this.db.db.select().from(holidays)
            .where(isNull(holidays.deletedAt))
            .$dynamic();

        if (year) {
            query = query.where(sql`EXTRACT(YEAR FROM ${holidays.date}) = ${year}`);
        }

        return query.orderBy(asc(holidays.date));
    }

    async findOne(id: string) {
        const [holiday] = await this.db.db.select().from(holidays).where(and(eq(holidays.id, id), isNull(holidays.deletedAt)));
        if (!holiday) {
            throw new NotFoundException(`Holiday with ID ${id} not found`);
        }
        return holiday;
    }

    async create(dto: CreateHolidayDto, actorId: string) {
        try {
            const [newHoliday] = await this.db.db.insert(holidays).values({
                ...dto,
                date: dto.date,
            }).returning();

            await this.auditService.log({
                userId: actorId,
                action: 'CREATE',
                entityType: 'HOLIDAY',
                entityId: newHoliday.id,
                newValue: newHoliday,
            });

            return newHoliday;
        } catch (error: any) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (error.code === '23505') { // Unique violation
                throw new ConflictException('A holiday already exists on this date for this country');
            }
            throw error;
        }
    }

    async update(id: string, dto: UpdateHolidayDto, actorId: string) {
        const current = await this.findOne(id);

        const [updated] = await this.db.db
            .update(holidays)
            .set({
                ...dto,
                updatedAt: new Date(),
            })
            .where(eq(holidays.id, id))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'UPDATE',
            entityType: 'HOLIDAY',
            entityId: id,
            oldValue: current,
            newValue: updated,
        });

        return updated;
    }

    async delete(id: string, actorId: string) {
        const current = await this.findOne(id);

        await this.db.db
            .update(holidays)
            .set({ deletedAt: new Date() })
            .where(eq(holidays.id, id));

        await this.auditService.log({
            userId: actorId,
            action: 'DELETE',
            entityType: 'HOLIDAY',
            entityId: id,
            oldValue: current,
        });

        return { success: true };
    }

    async isHoliday(date: Date | string, countryCode: string = 'PH') {
        const d = typeof date === 'string' ? new Date(date) : date;
        const dateString = d.toISOString().split('T')[0];

        const [match] = await this.db.db.select().from(holidays).where(
            and(
                eq(holidays.date, dateString),
                eq(holidays.countryCode, countryCode),
                isNull(holidays.deletedAt)
            )
        );

        return match || null;
    }

    /**
     * Triggers the unworked holiday pay generation for a specific holiday.
     */
    async processHoliday(id: string, actorId: string) {
        const holiday = await this.findOne(id);

        const result = await this.automationService.processHolidayPay(holiday.date);

        await this.auditService.log({
            userId: actorId,
            action: 'PROCESS_HOLIDAY_PAY',
            entityType: 'HOLIDAY',
            entityId: id,
            metadata: { date: holiday.date, ...result }
        });

        return result;
    }
}

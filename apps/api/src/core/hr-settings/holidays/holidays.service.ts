import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { holidays } from '@hybrid-hris/db/schema';
import { eq, and, sql, desc, asc, isNull } from 'drizzle-orm';
import { AuditService } from '../../audit/audit.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidaysService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async findAll(year?: number) {
        if (year) {
            return this.db.db.select().from(holidays)
                .where(
                    and(
                        isNull(holidays.deletedAt),
                        sql`EXTRACT(YEAR FROM ${holidays.date}) = ${year} OR ${holidays.isRecurring} = true`
                    )
                )
                .orderBy(asc(holidays.date));
        }

        return this.db.db.select().from(holidays)
            .where(isNull(holidays.deletedAt))
            .orderBy(desc(holidays.date));
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
                date: dto.date, // Drizzle handles date string
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
        
        // Check exact match first
        const [exactMatch] = await this.db.db.select().from(holidays).where(
            and(
                eq(holidays.date, dateString),
                eq(holidays.countryCode, countryCode),
                isNull(holidays.deletedAt)
            )
        );

        if (exactMatch) return exactMatch;

        // Check recurring matching month and day
        const month = d.getMonth() + 1;
        const day = d.getDate();

        const [recurringMatch] = await this.db.db.select().from(holidays).where(
            and(
                eq(holidays.isRecurring, true),
                eq(holidays.countryCode, countryCode),
                isNull(holidays.deletedAt),
                sql`EXTRACT(MONTH FROM ${holidays.date}) = ${month}`,
                sql`EXTRACT(DAY FROM ${holidays.date}) = ${day}`
            )
        );

        return recurringMatch || null;
    }
}

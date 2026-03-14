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

    async generateYearly(year: number, actorId: string) {
        const standardHolidays = [
            { name: "New Year's Day", month: 1, day: 1, type: 'REGULAR' },
            { name: "Araw ng Kagitingan", month: 4, day: 9, type: 'REGULAR' },
            { name: "Labor Day", month: 5, day: 1, type: 'REGULAR' },
            { name: "Independence Day", month: 6, day: 12, type: 'REGULAR' },
            { name: "National Heroes Day", month: 8, day: 31, type: 'REGULAR' }, 
            { name: "Bonifacio Day", month: 11, day: 30, type: 'REGULAR' },
            { name: "Christmas Day", month: 12, day: 25, type: 'REGULAR' },
            { name: "Rizal Day", month: 12, day: 30, type: 'REGULAR' },
            { name: "Feast of the Immaculate Conception", month: 12, day: 8, type: 'SPECIAL' },
            { name: "Last Day of the Year", month: 12, day: 31, type: 'SPECIAL' },
        ];

        const inserted = [];
        
        // 1. Insert fixed standard holidays
        for (const h of standardHolidays) {
            const dateStr = `${year}-${h.month.toString().padStart(2, '0')}-${h.day.toString().padStart(2, '0')}`;
            
            // Check if already exists
            const existing = await this.isHoliday(dateStr);
            if (!existing) {
                const [newH] = await this.db.db.insert(holidays).values({
                    name: h.name,
                    date: dateStr,
                    type: h.type as any,
                    countryCode: 'PH',
                    isRecurring: true
                }).returning();
                inserted.push(newH);
            }
        }

        // 2. Find any custom 'recurring' holidays from the previous year and carry them over
        const previousYear = year - 1;
        const prevRecurring = await this.db.db.select().from(holidays).where(and(
            sql`EXTRACT(YEAR FROM ${holidays.date}) = ${previousYear}`,
            eq(holidays.isRecurring, true),
            isNull(holidays.deletedAt)
        ));

        for (const pr of prevRecurring) {
            // Get original month/day
            const d = new Date(pr.date);
            const m = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const newDateStr = `${year}-${m}-${day}`;

            // Check if already exists (might have been covered by standard or already added)
            const existing = await this.isHoliday(newDateStr);
            if (!existing) {
                const [newH] = await this.db.db.insert(holidays).values({
                    name: pr.name,
                    date: newDateStr,
                    type: pr.type,
                    countryCode: pr.countryCode,
                    isRecurring: true
                }).returning();
                inserted.push(newH);
            }
        }

        if (inserted.length > 0) {
            await this.auditService.log({
                userId: actorId,
                action: 'GENERATE_YEARLY_HOLIDAYS',
                entityType: 'HOLIDAY',
                metadata: { year, count: inserted.length, ids: inserted.map(i => i.id) }
            });
        }

        return { count: inserted.length };
    }

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

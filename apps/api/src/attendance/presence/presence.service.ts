import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { OrgUnitsService } from 'src/core/org-units/org-units.service';
import { ShiftAssignmentsService } from '../shift-assignments/shift-assignments.service';
import { employees, attendanceLogs, Employee } from '@hybrid-hris/db';
import { and, eq, inArray } from 'drizzle-orm';
import { User } from 'src/identity/users/users.types';
import { SystemRole } from '@hybrid-hris/domain';

export type PresenceStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'OFF_DAY' | 'NO_SCHEDULE';

export interface PresenceRecord {
    employee: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'employeeNo'>;
    status: PresenceStatus;
    log: {
        workDate: string;
        actualInAt: Date | null;
        scheduledInAt: Date | null;
        gracePeriodMinutes: number;
    } | null;
}

@Injectable()
export class PresenceService {
    constructor(
        private readonly db: DatabaseService,
        private readonly orgUnitsService: OrgUnitsService,
        private readonly shiftsService: ShiftAssignmentsService,
    ) { }

    async getTeamPresence(actor: User, options?: { page?: number; limit?: number }) {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 50;
        const offset = (page - 1) * limit;

        const allTargetEmployeeIds = await this.getVisibleEmployeeIds(actor);

        if (allTargetEmployeeIds.length === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0 }
            };
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Apply Pagination
        const total = allTargetEmployeeIds.length;
        const targetEmployeeIds = allTargetEmployeeIds.slice(offset, offset + limit);

        if (targetEmployeeIds.length === 0) {
            return {
                data: [],
                meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
            };
        }
        
        // 1. Fetch employees in scope
        const targetEmployees = await this.db.db
            .select({
                id: employees.id,
                firstName: employees.firstName,
                lastName: employees.lastName,
                employeeNo: employees.employeeNo,
            })
            .from(employees)
            .where(inArray(employees.id, targetEmployeeIds));

        // 2. Fetch today's attendance logs for them
        const logs = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(and(
                inArray(attendanceLogs.employeeId, targetEmployeeIds),
                eq(attendanceLogs.workDate, today)
            ));

        // 3. Fetch today's schedules for them in bulk rather than individual queries (Fixes N+1 issue)
        const schedules = await this.shiftsService.findActiveForDateByEmployeeIds(targetEmployeeIds, today);

        // 4. Determine status for each employee
        const presenceRecords: PresenceRecord[] = targetEmployees.map(emp => {
            const schedule = schedules.find(s => s?.employeeId === emp.id);
            const log = logs.find(l => l.employeeId === emp.id);
            
            if (!schedule) {
                return { employee: emp, status: 'NO_SCHEDULE', log: null };
            }

            if (log?.status === 'LEAVE') {
                 return { employee: emp, status: 'ON_LEAVE', log: null };
            }

            const scheduledInAt = this.getScheduledInTime(today, schedule.startTime);
            const gracePeriodMinutes = schedule.gracePeriodMinutes ?? 0;

            if (!log?.actualInAt) {
                return { 
                    employee: emp, 
                    status: 'ABSENT', 
                    log: { 
                        workDate: today, 
                        scheduledInAt, 
                        actualInAt: null,
                        gracePeriodMinutes
                    } 
                };
            }

            // Apply grace period from shift snapshot
            const gracePeriodMs = gracePeriodMinutes * 60 * 1000;
            const status = log.actualInAt.getTime() > scheduledInAt.getTime() + gracePeriodMs ? 'LATE' : 'ON_TIME';

            return {
                employee: emp,
                status,
                log: {
                    workDate: today,
                    actualInAt: log.actualInAt,
                    scheduledInAt,
                    gracePeriodMinutes
                }
            };
        });

        return {
            data: presenceRecords,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    private async getVisibleEmployeeIds(actor: User): Promise<string[]> {
        // Admins see everyone
        if (actor.roles.includes(SystemRole.ADMIN) || actor.roles.includes(SystemRole.HR_ADMIN)) {
            const allEmployees = await this.db.db.select({ id: employees.id }).from(employees).where(eq(employees.status, 'ACTIVE'));
            return allEmployees.map(e => e.id);
        }

        // Supervisors/Managers see their subordinates
        if (actor.employeeId && (actor.roles.includes(SystemRole.MANAGER) || actor.roles.includes(SystemRole.SUPERVISOR))) {
            return this.orgUnitsService.findSubordinateIdsByManager(actor.employeeId);
        }
        
        return [];
    }

    private getScheduledInTime(date: string, time: string): Date {
        const [h, m] = time.split(':').map(Number);
        const d = new Date(date);
        d.setHours(h, m, 0, 0);
        return d;
    }
}

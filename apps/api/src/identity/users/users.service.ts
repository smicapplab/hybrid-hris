import { Injectable, NotFoundException } from '@nestjs/common'
import { and, eq, isNull, sql, getTableColumns } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'

import { DatabaseService } from 'src/database/database.service'
import { roles, userRoles, users, employees, orgUnitLeaders, orgUnits } from '@hybrid-hris/db/schema'
import { OrgUnitsService } from 'src/core/org-units/org-units.service'

@Injectable()
export class UsersService {
    constructor(
        private readonly db: DatabaseService,
        private readonly orgUnitsService: OrgUnitsService,
    ) { }

    async findActiveByEmail(email: string) {
        const normalized = email.trim().toLowerCase()
        const userColumns = getTableColumns(users)

        const [row] = await this.db.db
            .select({
                ...userColumns,
                firstName: employees.firstName,
                lastName: employees.lastName,
                orgUnitId: employees.orgUnitId,
            })
            .from(users)
            .leftJoin(employees, eq(users.employeeId, employees.id))
            .where(
                and(
                    eq(sql`lower(${users.email})`, normalized),
                    isNull(users.deletedAt),
                    eq(users.isActive, true),
                ),
            )
            .limit(1)

        return row ?? null
    }

    async getUserRoles(userId: string): Promise<string[]> {
        const rows = await this.db.db
            .select({ code: roles.code })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId))

        return rows.map((r) => r.code)
    }

    async findActiveById(id: string) {
        const userColumns = getTableColumns(users)

        const [row] = await this.db.db
            .select({
                ...userColumns,
                firstName: employees.firstName,
                lastName: employees.lastName,
                orgUnitId: employees.orgUnitId,
            })
            .from(users)
            .leftJoin(employees, eq(users.employeeId, employees.id))
            .where(
                and(
                    eq(users.id, id),
                    isNull(users.deletedAt),
                    eq(users.isActive, true),
                ),
            )
            .limit(1)

        return row ?? null
    }

    /**
     * Hash and store a new 6-digit attendance PIN for the given user.
     * Also clears any existing lockout state so a freshly set PIN works immediately.
     */
    async updateAttendancePin(userId: string, pin: string): Promise<void> {
        const [existing] = await this.db.db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.id, userId), isNull(users.deletedAt)))
            .limit(1)

        if (!existing) {
            throw new NotFoundException('User not found')
        }

        const pinHash = await bcrypt.hash(pin, 10)

        await this.db.db
            .update(users)
            .set({
                attendancePinHash: pinHash,
                attendancePinSetAt: new Date(),
                attendancePinAttempts: 0,
                attendancePinLockedUntil: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
    }

    async getEmployeeOrgUnitId(employeeId: string): Promise<string | null> {
        const [emp] = await this.db.db
            .select({ orgUnitId: employees.orgUnitId })
            .from(employees)
            .where(eq(employees.id, employeeId))
            .limit(1);
        return emp?.orgUnitId ?? null;
    }

    /**
     * Consolidates user profile data and structural flags (isSupervisor, isOrgLead, isRootLeader)
     * in a single method to minimize redundant DB calls.
     */
    async getUserFullProfile(userId: string) {
        const user = await this.findActiveById(userId);
        if (!user) return null;

        const roles = await this.getUserRoles(userId);

        if (!user.employeeId) {
            return {
                ...user,
                roles,
                isSupervisor: false,
                isOrgLead: false,
                isRootLeader: false,
                ledOrgUnitIds: [] as string[],
            };
        }

        const [isSupervisorResult, leadStatus] = await Promise.all([
            this.db.db
                .select({ id: employees.id })
                .from(employees)
                .where(and(eq(employees.supervisorId, user.employeeId), isNull(employees.deletedAt)))
                .limit(1),
            this.db.db
                .select({ 
                    orgUnitId: orgUnitLeaders.orgUnitId,
                    parentId: orgUnits.parentId 
                })
                .from(orgUnitLeaders)
                .innerJoin(orgUnits, eq(orgUnitLeaders.orgUnitId, orgUnits.id))
                .where(and(
                    eq(orgUnitLeaders.employeeId, user.employeeId),
                    isNull(orgUnitLeaders.deletedAt)
                ))
        ]);

        const isSupervisor = isSupervisorResult.length > 0;
        const ledOrgUnitIds = leadStatus.map(l => l.orgUnitId);
        const isOrgLead = ledOrgUnitIds.length > 0;
        const isRootLeader = leadStatus.some(l => l.parentId === null);

        return {
            ...user,
            roles,
            isSupervisor,
            isOrgLead,
            isRootLeader,
            ledOrgUnitIds,
        };
    }
}
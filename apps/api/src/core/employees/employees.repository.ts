import { Injectable } from '@nestjs/common'
import { and, eq, inArray, isNull, sql, SQL, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { EmployeeFilterDto } from './dto/employee-filter.dto'
import { DbOrTx, Tx } from 'src/database/database.types'
import {
    employees,
    employeeIdentifiers,
    employeeProfiles,
    hrSettings,
    orgUnits,
    orgUnitPositions,
    positions,
    roles,
    userRoles,
    users,
} from '@hybrid-hris/db'

@Injectable()
export class EmployeesRepository {
    
    // ─── Listing ──────────────────────────────────────────────────────────────
    async findWithFilters(db: DbOrTx, filter: EmployeeFilterDto) {
        const {
            search,
            roleIds,
            positionIds,
            orgUnitIds,
            status,
            showDeleted = false,
            sortBy = 'lastName',
            sortOrder = 'asc',
            page = 1,
            pageSize = 20,
        } = filter

        const conditions: SQL[] = []

        if (search) {
            const searchValue = `%${search.toLowerCase()}%`

            conditions.push(sql`
                (
                    lower(${employees.firstName}) LIKE ${searchValue}
                    OR lower(${employees.lastName}) LIKE ${searchValue}
                    OR lower(${employees.middleName}) LIKE ${searchValue}
                )
            `)
        }

        if (positionIds?.length) {
            conditions.push(inArray(employees.positionId, positionIds))
        }

        if (orgUnitIds?.length) {
            conditions.push(sql`
                ${employees.orgUnitId} IN (
                    WITH RECURSIVE org_tree AS (
                        SELECT id FROM ${orgUnits} WHERE id = ANY(${orgUnitIds})
                        UNION ALL
                        SELECT ou.id
                        FROM ${orgUnits} ou
                        JOIN org_tree ot ON ou.parent_id = ot.id
                    )
                    SELECT id FROM org_tree
                )
            `)
        }

        if (status?.length) {
            conditions.push(inArray(employees.status, status))
        }

        if (!showDeleted) {
            conditions.push(isNull(employees.deletedAt))
        }

        if (roleIds?.length) {
            conditions.push(sql`
                EXISTS (
                    SELECT 1
                    FROM ${userRoles} ur
                    JOIN ${roles} r ON r.id = ur.role_id
                    JOIN ${users} u ON u.id = ur.user_id
                    WHERE u.employee_id = ${employees.id}
                    AND r.id = ANY(${roleIds})
                )
            `)
        }

        const offset = (page - 1) * pageSize

        const baseSelect = db
            .select({
                id: employees.id,
                employeeNo: employees.employeeNo,
                firstName: employees.firstName,
                lastName: employees.lastName,
                status: employees.status,
                hireDate: employees.hireDate,
                positionTitle: positions.title,
                orgUnitName: orgUnits.name,

                // user (auth)
                email: users.email,

                // profile (non-auth)
                personalEmail: employeeProfiles.personalEmail,
                mobileNo: employeeProfiles.mobileNo,

                // identifiers (PH-centric)
                tinNo: employeeIdentifiers.tinNo,
                sssNo: employeeIdentifiers.sssNo,
                philHealthNo: employeeIdentifiers.philHealthNo,
                pagIbigNo: employeeIdentifiers.pagIbigNo,
            })
            .from(employees)
            .leftJoin(positions, eq(employees.positionId, positions.id))
            .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
            .leftJoin(users, eq(users.employeeId, employees.id))
            .leftJoin(employeeProfiles, eq(employeeProfiles.employeeId, employees.id))
            .leftJoin(employeeIdentifiers, eq(employeeIdentifiers.employeeId, employees.id))

        const dataQuery = conditions.length
            ? baseSelect.where(and(...conditions))
            : baseSelect

        const countBase = db
            .select({ count: sql<number>`count(*)` })
            .from(employees)

        const countQuery = conditions.length
            ? countBase.where(and(...conditions))
            : countBase

        const sortColumnMap = {
            firstName: employees.firstName,
            lastName: employees.lastName,
            hireDate: employees.hireDate,
            status: employees.status,
        } as const

        const sortColumn = sortColumnMap[sortBy] ?? employees.lastName

        const orderedQuery = sortOrder === 'desc'
            ? dataQuery.orderBy(sql`${sortColumn} DESC`, employees.id)
            : dataQuery.orderBy(sql`${sortColumn} ASC`, employees.id)

        const [data, totalResult] = await Promise.all([
            orderedQuery.limit(pageSize).offset(offset),
            countQuery,
        ])

        const total = Number(totalResult[0]?.count ?? 0)

        return {
            data,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        }
    }

    async findByIdWithDetails(
        db: DbOrTx,
        employeeId: string,
        opts?: { includeDeleted?: boolean },
    ): Promise<{
        employee: InferSelectModel<typeof employees>
        email: string | null
        profile: InferSelectModel<typeof employeeProfiles> | null
        identifiers: InferSelectModel<typeof employeeIdentifiers> | null
    } | null> {
        const includeDeleted = opts?.includeDeleted ?? false

        const whereClause = includeDeleted
            ? eq(employees.id, employeeId)
            : and(eq(employees.id, employeeId), isNull(employees.deletedAt))

        const [row] = await db
            .select({
                employee: employees,
                email: users.email,
                profile: employeeProfiles,
                identifiers: employeeIdentifiers,
            })
            .from(employees)
            .leftJoin(users, eq(users.employeeId, employees.id))
            .leftJoin(employeeProfiles, eq(employeeProfiles.employeeId, employees.id))
            .leftJoin(employeeIdentifiers, eq(employeeIdentifiers.employeeId, employees.id))
            .where(whereClause)
            .limit(1)

        return row ?? null
    }

    // ─── Lookups ──────────────────────────────────────────────────────────────

    async findEmployee(db: DbOrTx, id: string): Promise<InferSelectModel<typeof employees> | undefined> {
        const [row] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, id))
            .limit(1)

        return row
    }

    async findUserByEmployeeId(db: DbOrTx, employeeId: string): Promise<InferSelectModel<typeof users> | undefined> {
        const [row] = await db
            .select()
            .from(users)
            .where(eq(users.employeeId, employeeId))
            .limit(1)

        return row
    }

    async findUserByEmail(db: DbOrTx, email: string): Promise<{ id: string } | undefined> {
        const [row] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        return row
    }

    async findPositionById(db: DbOrTx, id: string): Promise<InferSelectModel<typeof positions> | undefined> {
        const [row] = await db
            .select()
            .from(positions)
            .where(eq(positions.id, id))
            .limit(1)

        return row
    }

    async findOrgUnitById(db: DbOrTx, id: string): Promise<InferSelectModel<typeof orgUnits> | undefined> {
        const [row] = await db
            .select()
            .from(orgUnits)
            .where(eq(orgUnits.id, id))
            .limit(1)

        return row
    }

    async findOrgUnitPositionMapping(db: DbOrTx, orgUnitId: string, positionId: string): Promise<boolean> {
        const [row] = await db
            .select({ orgUnitId: orgUnitPositions.orgUnitId })
            .from(orgUnitPositions)
            .where(
                and(
                    eq(orgUnitPositions.orgUnitId, orgUnitId),
                    eq(orgUnitPositions.positionId, positionId),
                ),
            )
            .limit(1)

        return !!row
    }

    async findFirstNonDeletedSubordinate(
        db: DbOrTx,
        supervisorId: string,
    ): Promise<{ status: InferSelectModel<typeof employees>['status'] } | undefined> {
        const [row] = await db
            .select({ status: employees.status })
            .from(employees)
            .where(
                and(
                    eq(employees.supervisorId, supervisorId),
                    isNull(employees.deletedAt),
                ),
            )
            .limit(1)

        return row
    }

    async getHrConfig(db: DbOrTx): Promise<Pick<InferSelectModel<typeof hrSettings>, 'emailDomain' | 'timezone'> | null> {
        const [row] = await db
            .select({ emailDomain: hrSettings.emailDomain, timezone: hrSettings.timezone })
            .from(hrSettings)
            .limit(1)

        return row ?? null
    }

    async lockAndIncrementHrSettings(tx: Tx): Promise<InferSelectModel<typeof hrSettings> | undefined> {
        const [settings] = await tx
            .select()
            .from(hrSettings)
            .limit(1)
            .for('update')

        if (!settings) return undefined

        await tx
            .update(hrSettings)
            .set({ employeeNoNext: settings.employeeNoNext + 1 })

        return settings
    }

    // ─── Writes ───────────────────────────────────────────────────────────────

    insertEmployee(tx: Tx, data: InferInsertModel<typeof employees>) {
        return tx.insert(employees).values(data).returning()
    }

    insertUser(tx: Tx, data: InferInsertModel<typeof users>) {
        return tx.insert(users).values(data).returning()
    }

    async assignEmployeeRoles(tx: Tx, payload: { userId: string; additionalRoleIds: string[] }) {
        const [employeeRole]: InferSelectModel<typeof roles>[] = await tx
            .select()
            .from(roles)
            .where(eq(roles.code, 'EMPLOYEE'))

        if (!employeeRole) {
            throw new Error('EMPLOYEE role not found')
        }

        const roleIds = [
            employeeRole.id,
            ...payload.additionalRoleIds.filter((id) => id !== employeeRole.id),
        ]

        if (!roleIds.length) return

        await tx.insert(userRoles).values(
            roleIds.map((roleId) => ({
                userId: payload.userId,
                roleId,
            })),
        )
    }

    async updateEmployee(
        tx: Tx,
        id: string,
        payload: Partial<InferSelectModel<typeof employees>>,
    ): Promise<InferSelectModel<typeof employees>> {
        const [updated] = await tx
            .update(employees)
            .set(payload)
            .where(eq(employees.id, id))
            .returning()

        return updated
    }

    async updateUserEmail(tx: Tx, userId: string, email: string): Promise<void> {
        await tx
            .update(users)
            .set({ email })
            .where(eq(users.id, userId))
    }

    async setUserActive(tx: Tx, employeeId: string, isActive: boolean): Promise<void> {
        await tx
            .update(users)
            .set({ isActive })
            .where(eq(users.employeeId, employeeId))
    }

    async upsertProfile(
        tx: Tx,
        employeeId: string,
        payload: Partial<InferSelectModel<typeof employeeProfiles>>,
    ): Promise<void> {
        const [existing] = await tx
            .select()
            .from(employeeProfiles)
            .where(eq(employeeProfiles.employeeId, employeeId))
            .limit(1)

        if (existing) {
            await tx
                .update(employeeProfiles)
                .set(payload)
                .where(eq(employeeProfiles.employeeId, employeeId))
        } else {
            await tx.insert(employeeProfiles).values({
                employeeId,
                ...payload,
                createdAt: new Date(),
            })
        }
    }

    async upsertIdentifiers(
        tx: Tx,
        employeeId: string,
        payload: Partial<InferSelectModel<typeof employeeIdentifiers>>,
    ): Promise<void> {
        const [existing] = await tx
            .select()
            .from(employeeIdentifiers)
            .where(eq(employeeIdentifiers.employeeId, employeeId))
            .limit(1)

        if (existing) {
            await tx
                .update(employeeIdentifiers)
                .set(payload)
                .where(eq(employeeIdentifiers.employeeId, employeeId))
        } else {
            await tx.insert(employeeIdentifiers).values({
                employeeId,
                ...payload,
                createdAt: new Date(),
            })
        }
    }
}
import { Injectable } from '@nestjs/common'
import { and, eq, inArray, sql, SQL } from 'drizzle-orm'
import { PgTransaction } from 'drizzle-orm/pg-core'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { EmployeeFilterDto } from './dto/employee-filter.dto'
import { DatabaseService } from 'src/database/database.service'
import { employees, orgUnits, positions, users, roles, userRoles } from '@hybrid-hris/db'

@Injectable()
export class EmployeesRepository {
    constructor(private readonly db: DatabaseService) { }

    async findWithFilters(filter: EmployeeFilterDto) {
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
            conditions.push(
                inArray(
                    employees.status,
                    status
                )
            )
        }

        // Soft delete filter (default: exclude deleted)
        if (!showDeleted) {
            conditions.push(sql`${employees.deletedAt} IS NULL`)
        }

        if (roleIds?.length) {
            conditions.push(sql`
                EXISTS (
                    SELECT 1
                    FROM ${userRoles} ur
                    JOIN ${roles} r ON r.id = ur.role_id
                    WHERE ur.user_id = ${users.id}
                    AND r.id = ANY(${roleIds})
                )
            `)
        }

        const offset = (page - 1) * pageSize

        const baseSelect = this.db.db
            .select({
                id: employees.id,
                employeeNo: employees.employeeNo,
                firstName: employees.firstName,
                lastName: employees.lastName,
                status: employees.status,
                hireDate: employees.hireDate,
                positionTitle: positions.title,
                orgUnitName: orgUnits.name,
            })
            .from(employees)
            .leftJoin(positions, eq(employees.positionId, positions.id))
            .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
            .leftJoin(users, eq(users.employeeId, employees.id))

        const dataQuery = conditions.length
            ? baseSelect.where(and(...conditions))
            : baseSelect

        const countBase = this.db.db
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
            orderedQuery
                .limit(pageSize)
                .offset(offset),
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

    insertEmployee(
        tx: PgTransaction<any, any, any>,
        data: InferInsertModel<typeof employees>,
    ) {
        return tx
            .insert(employees)
            .values(data)
            .returning()
    }

    insertUser(
        tx: PgTransaction<any, any, any>,
        data: InferInsertModel<typeof users>,
    ) {
        return tx
            .insert(users)
            .values(data)
            .returning()
    }

    async assignEmployeeRoles(
        tx: PgTransaction<any, any, any>,
        payload: { userId: string; additionalRoleIds: string[] },
    ) {
        // Always fetch EMPLOYEE role
        const [employeeRole]: InferSelectModel<typeof roles>[] = await tx
            .select()
            .from(roles)
            .where(eq(roles.code, 'EMPLOYEE'))

        if (!employeeRole) {
            throw new Error('EMPLOYEE role not found')
        }

        const roleIds = [
            employeeRole.id,
            ...payload.additionalRoleIds.filter(
                (id) => id !== employeeRole.id,
            ),
        ]

        if (!roleIds.length) return

        await tx.insert(userRoles).values(
            roleIds.map((roleId) => ({
                userId: payload.userId,
                roleId,
            })),
        )
    }
}
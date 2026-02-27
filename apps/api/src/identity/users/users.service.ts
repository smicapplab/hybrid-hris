import { Injectable } from '@nestjs/common'
import { and, eq, isNull, sql, getTableColumns } from 'drizzle-orm'

import { DatabaseService } from 'src/database/database.service'
import { roles, userRoles, users, employees } from '@hybrid-hris/db/schema'

@Injectable()
export class UsersService {
    constructor(private readonly db: DatabaseService) { }

    async findActiveByEmail(email: string) {
        const normalized = email.trim().toLowerCase()
        const userColumns = getTableColumns(users)

        const [row] = await this.db.db
            .select({
                ...userColumns,
                firstName: employees.firstName,
                lastName: employees.lastName,
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
}
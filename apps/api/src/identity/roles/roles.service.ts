import { roles, userRoles, users } from '@hybrid-hris/db/schema'
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DatabaseService } from 'src/database/database.service'

@Injectable()
export class RolesService {
    constructor(private readonly db: DatabaseService) { }

    async getAllRoles() {
        return this.db.db
            .select({
                id: roles.id,
                code: roles.code,
                name: roles.name,
                description: roles.description,
                isSystem: roles.isSystem,
            })
            .from(roles)
    }

    async getUserRoles(userId: string) {
        return this.db.db
            .select({
                code: roles.code,
                name: roles.name,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId))
    }

    async assignRoleToUser(userId: string, roleCode: string) {
        const user = await this.db.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (!user.length) {
            throw new NotFoundException('User not found')
        }

        const role = await this.db.db
            .select({ id: roles.id })
            .from(roles)
            .where(eq(roles.code, roleCode))
            .limit(1)

        if (!role.length) {
            throw new NotFoundException('Role not found')
        }

        try {
            await this.db.db.insert(userRoles).values({
                userId,
                roleId: role[0].id,
            })
        } catch {
            throw new ConflictException('User already has this role')
        }

        return { success: true }
    }

    async removeRoleFromUser(userId: string, roleCode: string) {
        const role = await this.db.db
            .select({ id: roles.id })
            .from(roles)
            .where(eq(roles.code, roleCode))
            .limit(1)

        if (!role.length) {
            throw new NotFoundException('Role not found')
        }

        await this.db.db
            .delete(userRoles)
            .where(
                and(
                    eq(userRoles.userId, userId),
                    eq(userRoles.roleId, role[0].id),
                ),
            )

        return { success: true }
    }
}
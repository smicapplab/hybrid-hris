import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { Database } from '../database/database';
import { roles, userRoles, users } from '@hybrid-hris/db/schema';

@Injectable()
export class UsersService {
    
    constructor(private readonly database: Database) { }

    async findActiveByEmail(email: string) {
        const normalized = email.trim().toLowerCase();

        const [user] = await this.database.db
            .select()
            .from(users)
            .where(
                and(
                    eq(sql`lower(${users.email})`, normalized),
                    isNull(users.deletedAt),
                    eq(users.isActive, true),
                ),
            )
            .limit(1);

        return user ?? null;
    }

    async getUserRoles(userId: string): Promise<string[]> {
        const rows = await this.database.db
            .select({ code: roles.code })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));

        return rows.map((r) => r.code);
    }

    async findById(id: string) {
      const [user] = await this.database.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user ?? null;
    }
}
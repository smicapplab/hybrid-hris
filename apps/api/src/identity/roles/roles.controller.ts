import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { DatabaseService } from 'src/database/database.service'
import { roles } from '@hybrid-hris/db/schema'
import { asc } from 'drizzle-orm'

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
    constructor(private readonly db: DatabaseService) { }

    @Get()
    async findAll() {
        return this.db.db
            .select()
            .from(roles)
            .orderBy(asc(roles.name));
    }
}

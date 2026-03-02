import {
    Controller,
    Get,
    Param,
    Query,
    Post,
    Patch,
    Delete,
    Body,
    UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'

import { LeaveTypesService } from './leave-types.service'

@UseGuards(JwtAuthGuard)
@Controller('leave-types')
export class LeaveTypesController {
    constructor(private readonly service: LeaveTypesService) { }

    @Get()
    async getAll(
        @Query('search') search?: string,
        @Query('includeDeleted') includeDeleted?: string,
    ) {
        return this.service.getAll({
            search,
            includeDeleted: includeDeleted === 'true',
        })
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.service.getById(id)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post()
    async create(
        @Body()
        body: {
            code: string
            name: string
            description?: string
            isAccrualBased?: boolean
            isPaid?: boolean
            accrualRatePerMonth?: string
            maxCarryOver?: string
        },
    ) {
        return this.service.create(body)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body()
        body: {
            code?: string
            name?: string
            description?: string
            isAccrualBased?: boolean
            isPaid?: boolean
            accrualRatePerMonth?: string | null
            maxCarryOver?: string | null
        },
    ) {
        return this.service.update(id, body)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Delete(':id')
    async softDelete(@Param('id') id: string) {
        return this.service.softDelete(id)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Patch(':id/restore')
    async restore(@Param('id') id: string) {
        return this.service.restore(id)
    }
}

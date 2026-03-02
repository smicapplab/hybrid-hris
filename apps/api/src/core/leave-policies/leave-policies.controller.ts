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
import { SystemRole, AccrualMethod } from '@hybrid-hris/domain'

import { LeavePoliciesService } from './leave-policies.service'

@UseGuards(JwtAuthGuard)
@Controller('leave-policies')
export class LeavePoliciesController {
    constructor(private readonly service: LeavePoliciesService) { }

    // ─── Policies ───────────────────────────────────────────────────────────────

    @Get()
    async getAll(
        @Query('search') search?: string,
        @Query('active') active?: string,
    ) {
        return this.service.getAll({
            search,
            active: active !== undefined ? active === 'true' : undefined,
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
            effectiveFrom: string
            effectiveTo?: string
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
            effectiveFrom?: string
            effectiveTo?: string | null
        },
    ) {
        return this.service.update(id, body)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Delete(':id')
    async deactivate(@Param('id') id: string) {
        return this.service.deactivate(id)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Patch(':id/activate')
    async activate(@Param('id') id: string) {
        return this.service.activate(id)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Patch(':id/set-default')
    async setDefault(@Param('id') id: string) {
        return this.service.setDefault(id)
    }

    // ─── Policy Rules ────────────────────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post(':id/rules')
    async addRule(
        @Param('id') policyId: string,
        @Body()
        body: {
            leaveTypeId: string
            accrualMethod: AccrualMethod
            accrualRatePerMonth?: string
            annualGrantAmount?: string
            maxBalance?: string
            maxCarryOver?: string
            allowNegativeBalance?: boolean
        },
    ) {
        return this.service.addRule(policyId, body)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Patch(':id/rules/:ruleId')
    async updateRule(
        @Param('id') policyId: string,
        @Param('ruleId') ruleId: string,
        @Body()
        body: {
            accrualMethod?: AccrualMethod
            accrualRatePerMonth?: string | null
            annualGrantAmount?: string | null
            maxBalance?: string | null
            maxCarryOver?: string | null
            allowNegativeBalance?: boolean
        },
    ) {
        return this.service.updateRule(policyId, ruleId, body)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Delete(':id/rules/:ruleId')
    async removeRule(
        @Param('id') policyId: string,
        @Param('ruleId') ruleId: string,
    ) {
        return this.service.removeRule(policyId, ruleId)
    }
}

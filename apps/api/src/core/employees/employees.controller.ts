import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { EmployeeFilterDto } from './dto/employee-filter.dto'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee-dto'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'
import { ChangeEmployeeStatusDto } from './dto/change-employee-status.dto'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Get()
    async findAll(@Query() filter: EmployeeFilterDto) {
        return this.employeesService.findAll(filter)
    }

    @Get('config')
    async getConfig() {
        return this.employeesService.getHrConfig()
    }

    @Get(':id/status/options')
    async getStatusOptions(
        @Param('id') id: string,
    ) {
        const employee = await this.employeesService.findById(id)
        return {
            current: employee.status,
            allowedNext: this.employeesService.getAllowedNextStatuses(employee.status),
        }
    }

    @Get(':id')
    async findById(
        @Param('id') id: string,
    ) {
        return this.employeesService.findById(id)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post()
    async create(
        @Body() dto: CreateEmployeeDto,
        @CurrentUser('id') actorId: string,
    ) {
        return this.employeesService.create(dto, actorId)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEmployeeDto,
        @CurrentUser('id') actorId: string,
    ) {
        return this.employeesService.update(id, dto, actorId)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post(':id/status')
    async changeStatus(
        @Param('id') id: string,
        @Body() dto: ChangeEmployeeStatusDto,
        @CurrentUser('id') actorId: string,
    ) {
        return this.employeesService.changeStatus(id, dto.status, actorId)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.employeesService.softDelete(id, actorId)
    }
}

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { EmployeeFilterDto } from './dto/employee-filter.dto'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Get()
    async findAll(@Query() filter: EmployeeFilterDto) {
        return this.employeesService.findAll(filter)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post()
    async create(@Body() dto: CreateEmployeeDto) {
        return this.employeesService.create(dto)
    }
}

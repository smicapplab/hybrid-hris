import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { EmployeeCompensationsService } from './employee-compensations.service';
import { CreateEmployeeCompensationDto } from './dto/create-employee-compensation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('employee-compensations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeCompensationsController {
    constructor(private readonly service: EmployeeCompensationsService) { }

    @Get()
    @Roles(SystemRole.HR_ADMIN)
    async findByEmployee(@Query('employeeId') employeeId: string) {
        return this.service.findByEmployee(employeeId);
    }

    @Post()
    @Roles(SystemRole.HR_ADMIN)
    async create(@Body() data: CreateEmployeeCompensationDto, @CurrentUser('id') actorId: string) {
        return this.service.create(data, actorId);
    }

    @Post('apply-template')
    @Roles(SystemRole.HR_ADMIN)
    async applyTemplate(@Body() data: { employeeId: string, templateId: string }, @CurrentUser('id') actorId: string) {
        return this.service.applyTemplate(data.employeeId, data.templateId, actorId);
    }

    @Patch(':id')
    @Roles(SystemRole.HR_ADMIN)
    async update(@Param('id') id: string, @Body() data: Partial<CreateEmployeeCompensationDto>, @CurrentUser('id') actorId: string) {
        return this.service.update(id, data, actorId);
    }

    @Delete(':id')
    @Roles(SystemRole.HR_ADMIN)
    async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
        return this.service.remove(id, actorId);
    }
}

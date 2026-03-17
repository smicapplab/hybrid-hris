import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PayrollComponentsService } from './payroll-components.service';
import { CreatePayrollComponentDto } from './dto/create-payroll-component.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('payroll-components')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollComponentsController {
    constructor(private readonly service: PayrollComponentsService) { }

    @Get()
    @Roles(SystemRole.HR_ADMIN)
    async findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @Roles(SystemRole.HR_ADMIN)
    async findById(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Post()
    @Roles(SystemRole.HR_ADMIN)
    async create(@Body() data: CreatePayrollComponentDto, @CurrentUser('id') actorId: string) {
        return this.service.create(data, actorId);
    }

    @Patch(':id')
    @Roles(SystemRole.HR_ADMIN)
    async update(@Param('id') id: string, @Body() data: Partial<CreatePayrollComponentDto>, @CurrentUser('id') actorId: string) {
        return this.service.update(id, data, actorId);
    }

    @Delete(':id')
    @Roles(SystemRole.HR_ADMIN)
    async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
        return this.service.remove(id, actorId);
    }
}

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreatePayrollBatchDto } from './dto/create-payroll-batch.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';

@Controller('payroll-batches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatchesController {
    constructor(private readonly batchesService: BatchesService) {}

    @Get()
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    findAll() {
        return this.batchesService.findAll();
    }

    @Get(':id')
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.batchesService.findOne(id);
    }

    @Post()
    @Roles(SystemRole.HR_ADMIN)
    create(@Body() dto: CreatePayrollBatchDto) {
        return this.batchesService.create(dto);
    }

    @Post(':id/process')
    @Roles(SystemRole.HR_ADMIN)
    process(@Param('id') id: string) {
        return this.batchesService.processBatch(id);
    }

    @Get('payslips/:id')
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.EMPLOYEE)
    getPayslip(@Param('id') id: string) {
        // TODO: In a real system, we'd check if the EMPLOYEE is the owner of the payslip
        return this.batchesService.getPayslipDetail(id);
    }

    @Get('payslips/employee/:id')
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.EMPLOYEE)
    getEmployeePayslips(@Param('id') id: string) {
        return this.batchesService.findEmployeePayslips(id);
    }
}

import { Controller, Delete, Get, Param, Post, Put, Query, Body } from '@nestjs/common'
import { ShiftAssignmentsService } from './shift-assignments.service'
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto'
import { UpdateShiftAssignmentDto } from './dto/update-shift-assignment.dto'

@Controller('shift-assignments')
export class ShiftAssignmentsController {
    constructor(private readonly shiftAssignmentsService: ShiftAssignmentsService) { }

    @Get()
    async findAllByEmployee(@Query('employeeId') employeeId: string) {
        return this.shiftAssignmentsService.findAllByEmployee(employeeId)
    }

    @Get('active')
    async findActiveForDate(
        @Query('employeeId') employeeId: string,
        @Query('workDate') workDate: string,
    ) {
        return this.shiftAssignmentsService.findActiveForDate(employeeId, workDate)
    }

    @Post()
    async create(@Body() body: CreateShiftAssignmentDto) {
        return this.shiftAssignmentsService.create(body)
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: UpdateShiftAssignmentDto,
    ) {
        return this.shiftAssignmentsService.update(id, body)
    }

    @Delete(':id')
    async softDelete(@Param('id') id: string) {
        return this.shiftAssignmentsService.softDelete(id)
    }
}
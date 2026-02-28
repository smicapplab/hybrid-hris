
import { Controller, Get, Param, Post, Put, Delete, Body, UseGuards } from '@nestjs/common'
import { ShiftTemplatesService } from './shift-templates.service'
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto'
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift-templates')
export class ShiftTemplatesController {
    constructor(private readonly shiftTemplatesService: ShiftTemplatesService) { }

    @Get()
    async findAll() {
        return this.shiftTemplatesService.findAll()
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.shiftTemplatesService.findById(id)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post()
    async create(@Body() body: CreateShiftTemplateDto) {
        return this.shiftTemplatesService.create(body)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: UpdateShiftTemplateDto,
    ) {
        return this.shiftTemplatesService.update(id, body)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Delete(':id')
    async softDelete(@Param('id') id: string) {
        return this.shiftTemplatesService.softDelete(id)
    }
}

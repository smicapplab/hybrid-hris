
import { Controller, Get, Param, Post, Put, Delete, Body } from '@nestjs/common'
import { ShiftTemplatesService } from './shift-templates.service'
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto'
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto'

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

    @Post()
    async create(@Body() body: CreateShiftTemplateDto) {
        return this.shiftTemplatesService.create(body)
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: UpdateShiftTemplateDto,
    ) {
        return this.shiftTemplatesService.update(id, body)
    }

    @Delete(':id')
    async softDelete(@Param('id') id: string) {
        return this.shiftTemplatesService.softDelete(id)
    }
}

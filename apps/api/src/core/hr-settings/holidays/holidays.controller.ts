import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common'
import { HolidaysService } from './holidays.service'
import { CreateHolidayDto } from './dto/create-holiday.dto'
import { UpdateHolidayDto } from './dto/update-holiday.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'

@Controller('hr-settings/holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
    constructor(private readonly service: HolidaysService) { }

    @Get()
    async findAll(@Query('year') year?: string) {
        const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear()
        return this.service.findAll(parsedYear)
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id)
    }

    @Post()
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    async create(
        @Body() dto: CreateHolidayDto,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.create(dto, actorId)
    }

    @Patch(':id')
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateHolidayDto,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.update(id, dto, actorId)
    }

    @Delete(':id')
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    async delete(
        @Param('id') id: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.delete(id, actorId)
    }

    @Post(':id/process')
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    async processHoliday(
        @Param('id') id: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.processHoliday(id, actorId)
    }
}

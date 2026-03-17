import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CompensationTemplatesService } from './compensation-templates.service';
import { CreateCompensationTemplateDto } from './dto/create-compensation-template.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('compensation-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompensationTemplatesController {
    constructor(private readonly service: CompensationTemplatesService) { }

    @Get()
    @Roles(SystemRole.HR_ADMIN)
    async findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @Roles(SystemRole.HR_ADMIN)
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Get('job-level/:jobLevelId')
    @Roles(SystemRole.HR_ADMIN)
    async findByJobLevel(@Param('jobLevelId') jobLevelId: string) {
        return this.service.findByJobLevel(jobLevelId);
    }

    @Post()
    @Roles(SystemRole.HR_ADMIN)
    async create(@Body() data: CreateCompensationTemplateDto, @CurrentUser('id') actorId: string) {
        return this.service.create(data, actorId);
    }

    @Patch(':id')
    @Roles(SystemRole.HR_ADMIN)
    async update(@Param('id') id: string, @Body() data: Partial<CreateCompensationTemplateDto>, @CurrentUser('id') actorId: string) {
        return this.service.update(id, data, actorId);
    }

    @Delete(':id')
    @Roles(SystemRole.HR_ADMIN)
    async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
        return this.service.remove(id, actorId);
    }
}

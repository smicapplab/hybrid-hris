import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JobLevelsService } from './job-levels.service';
import { CreateJobLevelDto } from './dto/create-job-level.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('job-levels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobLevelsController {
    constructor(private readonly service: JobLevelsService) { }

    @Get()
    async findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Post()
    @Roles(SystemRole.ADMIN, SystemRole.HR_ADMIN)
    async create(@Body() data: CreateJobLevelDto, @CurrentUser('id') actorId: string) {
        return this.service.create(data, actorId);
    }

    @Patch(':id')
    @Roles(SystemRole.ADMIN, SystemRole.HR_ADMIN)
    async update(@Param('id') id: string, @Body() data: Partial<CreateJobLevelDto>, @CurrentUser('id') actorId: string) {
        return this.service.update(id, data, actorId);
    }

    @Delete(':id')
    @Roles(SystemRole.ADMIN, SystemRole.HR_ADMIN)
    async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
        return this.service.remove(id, actorId);
    }
}

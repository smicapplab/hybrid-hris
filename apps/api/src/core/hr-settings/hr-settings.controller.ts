import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { HrSettingsService } from './hr-settings.service';
import { UpdateHrSettingsDto } from './dto/update-hr-settings.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.ADMIN)
@Controller('hr-settings')
export class HrSettingsController {
    constructor(private readonly service: HrSettingsService) { }

    @Get()
    async getSettings() {
        return this.service.getSettings();
    }

    @Patch()
    async updateSettings(@Body() dto: UpdateHrSettingsDto, @CurrentUser('id') actorId: string) {
        return this.service.updateSettings(dto, actorId);
    }
}

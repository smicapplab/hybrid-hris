import {
    Controller,
    Get,
    Param,
    UseGuards,
    Post,
    Patch,
    Delete,
    Body,
} from '@nestjs/common';
import { OrgUnitsService } from './org-units.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('org-units')
@UseGuards(JwtAuthGuard)
export class OrgUnitsController {
    constructor(private readonly service: OrgUnitsService) { }

    @Get()
    getFlat() {
        return this.service.getFlat();
    }

    @Get('tree')
    getTree() {
        return this.service.getTree();
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.service.getById(id);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('HR_ADMIN', 'ADMIN')
    create(@Body() body: { name: string; code: string; parentId?: string | null }) {
        return this.service.createOrgUnit(body);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles('HR_ADMIN', 'ADMIN')
    update(
        @Param('id') id: string,
        @Body()
        body: {
            name?: string;
            code?: string;
            parentId?: string | null;
            isActive?: boolean;
        },
    ) {
        return this.service.updateOrgUnit(id, body);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('HR_ADMIN', 'ADMIN')
    remove(@Param('id') id: string) {
        return this.service.softDeleteOrgUnit(id);
    }
}

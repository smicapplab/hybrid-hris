import {
    Controller,
    Get,
    Param,
    Post,
    Delete,
    Body,
    UseGuards,
    Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR_ADMIN', 'ADMIN')
@Controller('identity/roles')
export class RolesController {

    constructor(private readonly rolesService: RolesService) { }

    @Get()
    async getAllRoles(@Query('select') select?: string) {
        const roles = await this.rolesService.getAllRoles();

        // If no select query param, return minimal projection
        if (!select) {
            return roles.map(r => ({
                code: r.code,
                name: r.name,
            }));
        }

        const allowedFields = ['id', 'code', 'name', 'description', 'isSystem'];
        const requestedFields = select.split(',').map(f => f.trim());

        return roles.map(role => {
            const projected: Record<string, unknown> = {};

            for (const field of requestedFields) {
                if (allowedFields.includes(field) && field in role) {
                    const key = field as keyof typeof role;
                    projected[field] = role[key];
                }
            }

            return projected;
        });
    }

    @Get('users/:userId')
    async getUserRoles(@Param('userId') userId: string) {
        return this.rolesService.getUserRoles(userId);
    }

    @Post('users/:userId')
    async assignRole(
        @Param('userId') userId: string,
        @Body('roleCode') roleCode: string,
    ) {
        return this.rolesService.assignRoleToUser(userId, roleCode);
    }

    @Delete('users/:userId/:roleCode')
    async removeRole(
        @Param('userId') userId: string,
        @Param('roleCode') roleCode: string,
    ) {
        return this.rolesService.removeRoleFromUser(userId, roleCode);
    }
}

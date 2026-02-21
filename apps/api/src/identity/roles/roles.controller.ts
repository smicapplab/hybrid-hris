import {
    Controller,
    Get,
    Param,
    Post,
    Delete,
    Body,
} from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('identity/roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    async getAllRoles() {
        return this.rolesService.getAllRoles();
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

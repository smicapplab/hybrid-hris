import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Req,
    Query,
    Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ManpowerService } from './manpower.service';
import { CreateManpowerRequestDto, ActOnManpowerRequestDto } from './dto/manpower-request.dto';

type AuthRequest = Request & {
    user: { id: string; email: string; employeeId: string | null; roles: string[] }
}

@UseGuards(AuthGuard('jwt'))
@Controller('manpower')
export class ManpowerController {
    constructor(private readonly service: ManpowerService) { }

    @Post('requests')
    async create(@Req() req: AuthRequest, @Body() body: CreateManpowerRequestDto) {
        return this.service.createRequest(req.user.id, body);
    }

    @Get('requests')
    async getAll(
        @Query('orgUnitId') orgUnitId?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('isHistory') isHistory?: string,
    ) {
        return this.service.getAllRequests({
            orgUnitId,
            status,
            search,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            isHistory: isHistory === 'true',
        });
    }

    @Get('requests/:id')
    async getById(@Param('id') id: string) {
        return this.service.getRequestById(id);
    }

    @Patch('requests/:id')
    async update(
        @Req() req: AuthRequest,
        @Param('id') id: string,
        @Body() body: Partial<CreateManpowerRequestDto>,
    ) {
        return this.service.updateRequest(req.user.id, id, body);
    }

    @Post('requests/:id/submit')
    async submit(@Req() req: AuthRequest, @Param('id') id: string) {
        return this.service.submitRequest(req.user.id, id);
    }

    @Post('requests/:id/approve')
    async approve(
        @Req() req: AuthRequest,
        @Param('id') id: string,
        @Body() body: ActOnManpowerRequestDto,
    ) {
        return this.service.approveRequest(req.user.id, id, body);
    }

    @Get('plantilla/inventory/:orgUnitId')
    async getInventory(@Param('orgUnitId') orgUnitId: string) {
        return this.service.getPlantillaInventory(orgUnitId);
    }

    @Get('plantilla/overview/:orgUnitId')
    async getOverview(@Param('orgUnitId') orgUnitId: string) {
        return this.service.getPlantillaOverview(orgUnitId);
    }

    @Get('plantilla/flat')
    async getFlat() {
        return this.service.getFlatPlantilla();
    }
}

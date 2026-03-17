import {
    Controller,
    Get,
    Patch,
    Body,
    Req,
    UseGuards,
    UnprocessableEntityException,
    Query,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { ProfileService } from './profile.service'
import { UpdateMyProfileDto } from './dto/update-my-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { 
    MyProfileResponse, 
    OrgContextResponse, 
    PaginatedTeamMembersResponse 
} from './dto/profile.dto'

type AuthRequest = Request & {
    user: { id: string; email: string; employeeId: string | null; roles: string[] }
}

@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('me')
    async getMyProfile(@Req() req: AuthRequest): Promise<MyProfileResponse> {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.getMyProfile(req.user.employeeId, req.user.email)
    }

    @Get('me/team-members')
    async getMyTeamMembers(
        @Req() req: AuthRequest,
        @Query('recursive') recursive?: string,
        @Query('search') search?: string,
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
        @Query('scope') scope?: string,
    ): Promise<PaginatedTeamMembersResponse> {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        const isHr = req.user.roles.includes('HR_ADMIN') || req.user.roles.includes('ADMIN');

        return this.profileService.getMyTeamMembers(req.user.employeeId, {
            recursive: recursive === 'true',
            search,
            offset: offset ? parseInt(offset, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            scope,
            isHr,
        })
    }

    @Patch('me')
    async updateMyProfile(
        @Req() req: AuthRequest,
        @Body() body: UpdateMyProfileDto,
    ): Promise<MyProfileResponse> {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.updateMyProfile(req.user.id, req.user.employeeId, req.user.email, body)
    }

    @Patch('me/password')
    async changePassword(
        @Req() req: AuthRequest,
        @Body() body: ChangePasswordDto,
    ) {
        await this.profileService.changePassword(req.user.id, body)
        return { ok: true }
    }

    @Get('me/organization')
    async getMyOrganization(@Req() req: AuthRequest): Promise<OrgContextResponse> {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.getMyOrgContext(req.user.employeeId)
    }

    @Get('me/work-schedule')
    async getMyWorkSchedule(@Req() req: AuthRequest) {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.getMyWorkSchedule(req.user.employeeId)
    }

    @Get('me/attendance-history')
    async getMyAttendanceHistory(
        @Req() req: AuthRequest,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.getMyAttendanceHistory(req.user.employeeId, {
            from,
            to,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        })
    }

    @Get('me/payslips')
    async getMyPayslips(@Req() req: AuthRequest) {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.getMyPayslips(req.user.employeeId)
    }
}

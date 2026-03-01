import {
    Controller,
    Get,
    Patch,
    Body,
    Req,
    UseGuards,
    UnprocessableEntityException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { ProfileService } from './profile.service'
import { UpdateMyProfileDto } from './dto/update-my-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

type AuthRequest = Request & {
    user: { id: string; email: string; employeeId: string | null }
}

@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('me')
    async getMyProfile(@Req() req: AuthRequest) {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.getMyProfile(req.user.employeeId, req.user.email)
    }

    @Patch('me')
    async updateMyProfile(
        @Req() req: AuthRequest,
        @Body() body: UpdateMyProfileDto,
    ) {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.updateMyProfile(req.user.employeeId, req.user.email, body)
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
    async getMyOrganization(@Req() req: AuthRequest) {
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
    async getMyAttendanceHistory(@Req() req: AuthRequest) {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException('No employee record linked to this account')
        }
        return this.profileService.getMyAttendanceHistory(req.user.employeeId)
    }
}

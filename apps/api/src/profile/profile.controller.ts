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
}

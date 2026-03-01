import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdatePinDto } from './dto/update-pin.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly auth: AuthService) { }

    private refreshCookieName(): string {
        return process.env.COOKIE_REFRESH_NAME || 'hris_refresh';
    }

    private cookieOptions() {
        const secure = process.env.COOKIE_SECURE === 'true';
        const sameSite =
            (process.env.COOKIE_SAMESITE as
                | 'lax'
                | 'strict'
                | 'none'
                | undefined) || 'lax';
        const domain = process.env.COOKIE_DOMAIN || undefined;

        return {
            httpOnly: true,
            secure,
            sameSite,
            domain,
            path: '/auth/refresh',
        } as const;
    }

    @Post('login')
    async login(
        @Body() body: { email: string; password: string },
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = await this.auth.validateUser(body.email, body.password);

        const { accessToken, refreshToken } = await this.auth.login(user);

        res.cookie(this.refreshCookieName(), refreshToken, this.cookieOptions());

        return { accessToken };
    }

    @Post('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const raw = req.cookies?.[this.refreshCookieName()];
        if (typeof raw !== 'string') {
            throw new UnauthorizedException('Missing refresh token');
        }
        const token = raw;

        const userId = this.auth.extractSubFromToken(token);
        if (!userId) {
            throw new UnauthorizedException();
        }

        const { accessToken, refreshToken } = await this.auth.refresh(
            userId,
            token,
        );

        res.cookie(this.refreshCookieName(), refreshToken, this.cookieOptions());

        return { accessToken };
    }

    @Post('logout')
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const raw = req.cookies?.[this.refreshCookieName()];

        if (typeof raw === 'string') {
            const userId = this.auth.extractSubFromToken(raw);
            if (userId) {
                await this.auth.logout(userId);
            }
        }

        res.clearCookie(this.refreshCookieName(), this.cookieOptions());

        return { ok: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(
        @Req()
        req: Request & {
            user: {
                id: string;
                email: string;
                employeeId: string | null;
                firstName: string | null;
                lastName: string | null;
                roles: string[];
            };
        },
    ) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('pin')
    async updatePin(
        @Req() req: Request & { user: { id: string } },
        @Body() body: UpdatePinDto,
    ) {
        await this.auth.updateAttendancePin(req.user.id, body.pin)
        return { ok: true }
    }
}
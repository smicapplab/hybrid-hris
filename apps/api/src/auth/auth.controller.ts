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
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdatePinDto } from './dto/update-pin.dto';
import { OAuthUser } from './dto/auth.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly auth: AuthService) { }

    private refreshCookieName(): string {
        return process.env.COOKIE_REFRESH_NAME || 'hris_refresh';
    }

    private cookieOptions() {
        const isProduction = process.env.NODE_ENV === 'production';

        // Cross-domain deployments (Vercel frontend + EC2 API on different domains)
        // require SameSite=None + Secure=true or browsers will silently drop the
        // refresh-token cookie and every page reload redirects to login.
        //
        // In production these values are forced to cross-domain-safe defaults.
        // In development they fall back to lax/false so localhost works without HTTPS.
        const secure = isProduction
            ? process.env.COOKIE_SECURE !== 'false'          // true unless explicitly opted out
            : process.env.COOKIE_SECURE === 'true';           // false unless explicitly opted in

        const sameSite: 'none' | 'lax' | 'strict' = isProduction
            ? ((process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict') === 'none' ||
               (process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict') === 'strict'
                ? (process.env.COOKIE_SAMESITE as 'none' | 'strict')
                : 'none')                                      // default to none in production
            : ((process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict') || 'lax'); // default lax in dev

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

    @Get('config')
    async getConfig() {
        return this.auth.getAuthConfig();
    }

    // --- Google OAuth ---
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() _req: Request) {
        // Initiates the Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuthSuccess(req, res);
    }

    // --- Microsoft OAuth ---
    @Get('microsoft')
    @UseGuards(AuthGuard('microsoft'))
    async microsoftAuth(@Req() _req: Request) {
        // Initiates the Microsoft OAuth flow
    }

    @Get('microsoft/callback')
    @UseGuards(AuthGuard('microsoft'))
    async microsoftAuthRedirect(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuthSuccess(req, res);
    }

    private async handleOAuthSuccess(req: Request, res: Response) {
        const user = req.user as OAuthUser;
        if (!user) {
            throw new UnauthorizedException('OAuth user not found');
        }
        const { accessToken, refreshToken } = await this.auth.login(user);

        res.cookie(this.refreshCookieName(), refreshToken, this.cookieOptions());

        // Redirect to frontend with access token in URL fragment or similar
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
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
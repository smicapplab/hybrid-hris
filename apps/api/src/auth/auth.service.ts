import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { and, eq, isNull } from 'drizzle-orm';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { Database } from '../database/database';
import { userRefreshTokens, users } from '@hybrid-hris/db/schema';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly database: Database,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findActiveByEmail(email);

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);

        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    async login(user: typeof users.$inferSelect) {
        const roles = await this.usersService.getUserRoles(user.id);

        const payload = {
            sub: user.id,
            email: user.email,
            roles,
        };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET as string,
            expiresIn: process.env.JWT_REFRESH_TTL as any,
        });

        const decoded = this.jwtService.decode(refreshToken);

        if (
            !decoded ||
            typeof decoded !== 'object' ||
            !('exp' in decoded)
        ) {
            throw new UnauthorizedException();
        }

        const expiresAt = new Date(
            (decoded as { exp: number }).exp * 1000,
        );

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        await this.database.db.insert(userRefreshTokens).values({
            userId: user.id,
            tokenHash: refreshTokenHash,
            jti: crypto.randomUUID(),
            expiresAt,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async refresh(userId: string, refreshToken: string) {
        const tokens = await this.database.db
            .select()
            .from(userRefreshTokens)
            .where(
                and(
                    eq(userRefreshTokens.userId, userId),
                    isNull(userRefreshTokens.revokedAt),
                ),
            );

        for (const token of tokens) {
            const valid = await bcrypt.compare(refreshToken, token.tokenHash);

            if (valid) {
                // revoke old token (rotation)
                await this.database.db
                    .update(userRefreshTokens)
                    .set({ revokedAt: new Date() })
                    .where(eq(userRefreshTokens.id, token.id));

                const user = await this.usersService.findById(userId);
                if (!user) throw new UnauthorizedException();

                return this.login(user);
            }
        }

        throw new UnauthorizedException();
    }

    async logout(userId: string) {
        await this.database.db
            .update(userRefreshTokens)
            .set({ revokedAt: new Date() })
            .where(eq(userRefreshTokens.userId, userId));
    }
}

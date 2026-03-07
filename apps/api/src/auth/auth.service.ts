import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { and, eq, isNull } from 'drizzle-orm'
import * as crypto from 'crypto'

import { UsersService } from '../identity/users/users.service'
import { DatabaseService } from '../database/database.service'
import { userRefreshTokens, users, employees } from '@hybrid-hris/db/schema'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findActiveByEmail(email)

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash)

        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials')
        }

        return user
    }

    async login(
        user: typeof users.$inferSelect & {
            firstName?: string | null
            lastName?: string | null
        },
    ) {
        const roles = await this.usersService.getUserRoles(user.id)
        let orgUnitId: string | null = null;

        if (user.employeeId) {
            const [emp] = await this.db.db
                .select({ orgUnitId: employees.orgUnitId })
                .from(employees)
                .where(eq(employees.id, user.employeeId))
                .limit(1);
            orgUnitId = emp?.orgUnitId ?? null;
        }

        const payload = {
            sub: user.id,
            email: user.email,
            employeeId: user.employeeId ?? null,
            orgUnitId,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            roles,
        }

        const accessToken = this.jwtService.sign(payload)

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET as string,
            expiresIn: process.env.JWT_REFRESH_TTL as any,
        })

        const decoded = this.jwtService.decode(refreshToken)

        if (!decoded || typeof decoded !== 'object' || !('exp' in decoded)) {
            throw new UnauthorizedException()
        }

        const expiresAt = new Date((decoded as { exp: number }).exp * 1000)

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10)

        await this.db.db.insert(userRefreshTokens).values({
            userId: user.id,
            tokenHash: refreshTokenHash,
            jti: crypto.randomUUID(),
            expiresAt,
        })

        return { accessToken, refreshToken }
    }

    async refresh(userId: string, refreshToken: string) {
        const tokens = await this.db.db
            .select()
            .from(userRefreshTokens)
            .where(
                and(
                    eq(userRefreshTokens.userId, userId),
                    isNull(userRefreshTokens.revokedAt),
                ),
            )

        for (const token of tokens) {
            const valid = await bcrypt.compare(refreshToken, token.tokenHash)

            if (valid) {
                await this.db.db
                    .update(userRefreshTokens)
                    .set({ revokedAt: new Date() })
                    .where(eq(userRefreshTokens.id, token.id))

                const user = await this.usersService.findActiveById(userId)
                if (!user) throw new UnauthorizedException()

                return this.login(user)
            }
        }

        throw new UnauthorizedException()
    }

    async logout(userId: string) {
        await this.db.db
            .update(userRefreshTokens)
            .set({ revokedAt: new Date() })
            .where(eq(userRefreshTokens.userId, userId))
    }

    /**
     * Decode a token (no signature verification) and return the `sub` claim.
     * Used by the controller to extract the user ID from the refresh token cookie
     * before passing it to methods that perform their own secure verification.
     */
    extractSubFromToken(token: string): string | null {
        const decoded = this.jwtService.decode(token)
        if (
            typeof decoded !== 'object' ||
            decoded === null ||
            !('sub' in decoded) ||
            typeof (decoded as { sub?: unknown }).sub !== 'string'
        ) {
            return null
        }
        return (decoded as { sub: string }).sub
    }

    updateAttendancePin(userId: string, pin: string): Promise<void> {
        return this.usersService.updateAttendancePin(userId, pin)
    }
}
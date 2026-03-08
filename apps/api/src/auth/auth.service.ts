import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { and, eq, isNull } from 'drizzle-orm'
import * as crypto from 'crypto'

import { UsersService } from '../identity/users/users.service'
import { DatabaseService } from '../database/database.service'
import { HrSettingsService } from '../core/hr-settings/hr-settings.service'
import { userRefreshTokens, users, employees, userIdentities, employeeProfiles, employeeIdentifiers, roles, userRoles, orgUnits, positions } from '@hybrid-hris/db/schema'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
        private readonly hrSettingsService: HrSettingsService,
    ) { }

    async findActiveById(id: string) {
        return this.usersService.findActiveById(id);
    }

    async validateOAuthUser(profile: {
        provider: 'GOOGLE' | 'MICROSOFT';
        providerId: string;
        email: string;
        firstName: string;
        lastName: string;
    }) {
        const email = profile.email.toLowerCase().trim();

        // 1. Check if identity already exists
        const [identity] = await this.db.db
            .select()
            .from(userIdentities)
            .where(and(
                eq(userIdentities.provider, profile.provider),
                eq(userIdentities.providerId, profile.providerId)
            ))
            .limit(1);

        if (identity) {
            const user = await this.usersService.findActiveById(identity.userId);
            if (user) return user;
        }

        // 2. Not found by identity - check by email
        let user = await this.usersService.findActiveByEmail(email);

        if (user) {
            // Link existing user to this provider
            await this.db.db.insert(userIdentities).values({
                userId: user.id,
                provider: profile.provider,
                providerId: profile.providerId,
            }).onConflictDoNothing();

            return user;
        }

        // 3. Auto-Provision (Shadow Provisioning)
        // Check allowed domains from settings
        const settings = await this.hrSettingsService.getSettings();
        const domain = email.split('@')[1];
        
        const isAllowedDomain = settings?.allowedWorkspaceDomains?.some(
            d => d.toLowerCase() === domain.toLowerCase()
        );

        if (!isAllowedDomain) {
            throw new UnauthorizedException(`Domain ${domain} is not authorized for this workspace.`);
        }

        // Create new Employee + User
        return this.db.withTransaction(async (tx) => {
            // Find placeholder org and position
            const [defOrg] = await tx.select().from(orgUnits).where(eq(orgUnits.code, 'SYS_ADMIN')).limit(1);
            const [defPos] = await tx.select().from(positions).where(eq(positions.code, 'SYSTEM_ADMIN')).limit(1);

            if (!defOrg || !defPos) {
                throw new InternalServerErrorException('Default organizational setup missing. Please contact administrator.');
            }

            // Create Employee (Minimal info)
            const [newEmp] = await tx.insert(employees).values({
                employeeNo: `OAUTH-${Date.now()}`, // Temporary
                firstName: profile.firstName,
                lastName: profile.lastName,
                status: 'ACTIVE',
                employmentType: 'REGULAR',
                hireDate: new Date().toISOString().slice(0, 10),
                orgUnitId: defOrg.id,
                positionId: defPos.id,
            }).returning();

            // Basic Profile
            await tx.insert(employeeProfiles).values({
                employeeId: newEmp.id,
            });

            // Basic Identifiers
            await tx.insert(employeeIdentifiers).values({
                employeeId: newEmp.id,
            });

            // Create User
            const [newUser] = await tx.insert(users).values({
                employeeId: newEmp.id,
                email: email,
                isActive: true,
            }).returning();

            // Link Identity
            await tx.insert(userIdentities).values({
                userId: newUser.id,
                provider: profile.provider,
                providerId: profile.providerId,
            });

            // Assign basic EMPLOYEE role
            const [empRole] = await tx.select().from(roles).where(eq(roles.code, 'EMPLOYEE')).limit(1);
            if (empRole) {
                await tx.insert(userRoles).values({
                    userId: newUser.id,
                    roleId: empRole.id,
                });
            }

            return newUser;
        });
    }

    async getAuthConfig() {
        const settings = await this.hrSettingsService.getSettings();
        if (!settings) {
            return {
                passwordLoginEnabled: true,
                googleLoginEnabled: false,
                microsoftLoginEnabled: false,
                googleClientId: null,
                isDemo: false,
            };
        }

        const googleReady = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
        const msReady = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);

        // FOR DEMO: If keys are missing but settings are ON, we show buttons but mark as demo
        const showGoogle = settings.googleLoginEnabled;
        const showMs = settings.microsoftLoginEnabled;
        const isDemo = (showGoogle && !googleReady) || (showMs && !msReady);

        const googleActive = showGoogle;
        const msActive = showMs;

        // FAIL-SAFE: If no OAuth is active, password login MUST be enabled
        let passwordActive = settings.passwordLoginEnabled;
        if (!googleActive && !msActive) {
            passwordActive = true;
        }

        return {
            passwordLoginEnabled: passwordActive,
            googleLoginEnabled: googleActive,
            microsoftLoginEnabled: msActive,
            googleClientId: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
            isDemo,
        };
    }

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
        const profile = await this.usersService.getUserFullProfile(user.id);
        if (!profile) throw new UnauthorizedException();

        const { roles, isSupervisor, isOrgLead, isRootLeader, orgUnitId } = profile;
        
        // Dynamic Role Injection
        if (isRootLeader && !roles.includes('ADMIN')) {
            roles.push('ADMIN');
        }
        if (isOrgLead && !roles.includes('MANAGER')) {
            roles.push('MANAGER');
        }
        if (isSupervisor && !roles.includes('SUPERVISOR')) {
            roles.push('SUPERVISOR');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            employeeId: user.employeeId ?? null,
            orgUnitId,
            isSupervisor,
            isOrgLead,
            isRootLeader,
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
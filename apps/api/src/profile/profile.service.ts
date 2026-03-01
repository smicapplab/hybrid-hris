import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { and, asc, desc, eq, gte, isNull } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import { employees, employeeProfiles, users, positions, orgUnits, orgUnitLeaders, employeeShiftAssignments, shiftTemplates, attendanceLogs } from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import { UpdateMyProfileDto } from './dto/update-my-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@Injectable()
export class ProfileService {
    constructor(private readonly db: DatabaseService) { }

    async getMyProfile(employeeId: string, userEmail: string) {
        const [row] = await this.db.db
            .select({
                employee: employees,
                profile: employeeProfiles,
            })
            .from(employees)
            .leftJoin(employeeProfiles, eq(employeeProfiles.employeeId, employees.id))
            .where(eq(employees.id, employeeId))
            .limit(1)

        if (!row) {
            throw new NotFoundException('Employee record not found')
        }

        const { employee: emp, profile } = row

        return {
            // Identity — read-only
            email: userEmail,
            employeeNo: emp.employeeNo,
            firstName: emp.firstName,
            lastName: emp.lastName,
            middleName: emp.middleName ?? null,

            // Alternate contact + address — editable, stored on employees
            alternateEmail: emp.alternateEmail ?? null,
            addressLine1: emp.addressLine1 ?? null,
            addressLine2: emp.addressLine2 ?? null,
            city: emp.city ?? null,
            province: emp.province ?? null,
            postalCode: emp.postalCode ?? null,
            countryCode: emp.countryCode ?? 'PH',

            // Demographics + contacts — editable, stored on employee_profiles
            birthDate: profile?.birthDate ?? null,
            gender: profile?.gender ?? null,
            civilStatus: profile?.civilStatus ?? null,
            nationality: profile?.nationality ?? null,
            personalEmail: profile?.personalEmail ?? null,
            mobileNo: profile?.mobileNo ?? null,
            landlineNo: profile?.landlineNo ?? null,
            emergencyContactName: profile?.emergencyContactName ?? null,
            emergencyContactRelationship: profile?.emergencyContactRelationship ?? null,
            emergencyContactMobileNo: profile?.emergencyContactMobileNo ?? null,
        }
    }

    async updateMyProfile(
        employeeId: string,
        userEmail: string,
        dto: UpdateMyProfileDto,
    ) {
        /* ── Split fields between the two tables ── */
        const EMPLOYEE_FIELDS = [
            'alternateEmail', 'addressLine1', 'addressLine2',
            'city', 'province', 'postalCode', 'countryCode',
        ] as const

        const PROFILE_FIELDS = [
            'birthDate', 'gender', 'civilStatus', 'nationality',
            'personalEmail', 'mobileNo', 'landlineNo',
            'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactMobileNo',
        ] as const

        const empPatch: Record<string, unknown> = {}
        for (const key of EMPLOYEE_FIELDS) {
            if (dto[key] !== undefined) empPatch[key] = dto[key]
        }

        const profilePatch: Record<string, unknown> = {}
        for (const key of PROFILE_FIELDS) {
            if (dto[key] !== undefined) profilePatch[key] = dto[key]
        }

        if (Object.keys(empPatch).length === 0 && Object.keys(profilePatch).length === 0) {
            throw new BadRequestException('No updatable fields provided')
        }

        await this.db.withTransaction(async (tx) => {
            if (Object.keys(empPatch).length > 0) {
                await tx
                    .update(employees)
                    .set({ ...empPatch, updatedAt: new Date() })
                    .where(eq(employees.id, employeeId))
            }

            if (Object.keys(profilePatch).length > 0) {
                // Upsert: create the profile row if it doesn't exist yet
                await tx
                    .insert(employeeProfiles)
                    .values({ employeeId, ...profilePatch, updatedAt: new Date() })
                    .onConflictDoUpdate({
                        target: employeeProfiles.employeeId,
                        set: { ...profilePatch, updatedAt: new Date() },
                    })
            }
        })

        return this.getMyProfile(employeeId, userEmail)
    }

    async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
        const [user] = await this.db.db
            .select({ id: users.id, passwordHash: users.passwordHash })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (!user) {
            throw new NotFoundException('User not found')
        }

        if (!user.passwordHash) {
            throw new BadRequestException('No password set on this account')
        }

        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash)
        if (!valid) {
            throw new UnauthorizedException('Current password is incorrect')
        }

        const COMMON_PASSWORDS = new Set([
            'password', '123456', '12345678', 'qwerty', 'abc123', 'password1',
            'iloveyou', 'admin', 'letmein', 'monkey', '1234567', 'sunshine',
            'princess', 'master', 'shadow', 'dragon', '123456789', '1234567890',
            'baseball', 'football', 'soccer', 'charlie', 'donald', 'batman',
            'trustno1', 'hello', 'welcome', 'michael', 'superman', 'jessica',
            '654321', '000000', 'qwerty123', 'pass', 'login', '111111', '12345',
            '1234', 'pass123', 'passw0rd', 'password12', 'changeme', 'secret',
            'matrix', 'computer', 'internet', 'mustang', 'access', 'ninja',
            'ranger', 'maverick', 'buster', 'tigger', 'smokey', 'golfer',
            'summer', 'winter', 'spring', 'flower', 'cookie', 'maggie', 'hockey',
            'dallas', 'harley', 'hunter', 'joshua', 'thomas', 'andrew', 'robert',
            'george', 'jordan', 'snoopy', 'garfield', 'pepper', 'ginger', 'coffee',
            'chocolate', 'pokemon', 'naruto', 'cheese', 'test123', 'admin123',
            'user123', 'abcdef', '1q2w3e4r', 'zxcvbnm', 'qwertyuiop', 'asdfghjkl',
            'password2', 'password3', 'spiderman', 'starwars', 'hello123', '123123',
            'p@ssword', 'pa$$word', 'p@ssw0rd', 'monkey1', 'love1234', 'test',
        ])
        
        if (COMMON_PASSWORDS.has(dto.newPassword.toLowerCase())) {
            throw new BadRequestException('New password is too common')
        }

        const newHash = await bcrypt.hash(dto.newPassword, 12)

        await this.db.db
            .update(users)
            .set({ passwordHash: newHash, updatedAt: new Date() })
            .where(eq(users.id, userId))
    }

    async getMyOrgContext(employeeId: string) {
        const [empRow] = await this.db.db
            .select({
                id: employees.id,
                firstName: employees.firstName,
                lastName: employees.lastName,
                employeeNo: employees.employeeNo,
                hireDate: employees.hireDate,
                status: employees.status,
                employmentType: employees.employmentType,
                orgUnitId: employees.orgUnitId,
                positionId: employees.positionId,
                supervisorId: employees.supervisorId,
            })
            .from(employees)
            .where(and(eq(employees.id, employeeId), isNull(employees.deletedAt)))
            .limit(1)

        if (!empRow) throw new NotFoundException('Employee not found')

        const [pos] = await this.db.db
            .select({ id: positions.id, title: positions.title, code: positions.code })
            .from(positions)
            .where(eq(positions.id, empRow.positionId))
            .limit(1)

        const allOrgs = await this.db.db.select().from(orgUnits)
        const orgById = new Map(allOrgs.map(o => [o.id, o]))

        const buildPath = (orgUnitId: string): string[] => {
            const parts: string[] = []
            let current = orgById.get(orgUnitId)
            while (current) {
                parts.unshift(current.name)
                if (!current.parentId) break
                current = orgById.get(current.parentId)
            }
            return parts
        }

        const org = orgById.get(empRow.orgUnitId)

        let supervisor: { id: string; firstName: string; lastName: string; positionTitle: string } | null = null
        if (empRow.supervisorId) {
            const [supRow] = await this.db.db
                .select({
                    id: employees.id,
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    positionTitle: positions.title,
                })
                .from(employees)
                .innerJoin(positions, eq(employees.positionId, positions.id))
                .where(and(eq(employees.id, empRow.supervisorId), isNull(employees.deletedAt)))
                .limit(1)
            if (supRow) supervisor = supRow
        }

        const directReports = await this.db.db
            .select({
                id: employees.id,
                firstName: employees.firstName,
                lastName: employees.lastName,
                positionTitle: positions.title,
            })
            .from(employees)
            .innerJoin(positions, eq(employees.positionId, positions.id))
            .where(and(eq(employees.supervisorId, employeeId), isNull(employees.deletedAt)))
            .orderBy(asc(employees.lastName))

        const leaders = await this.db.db
            .select({
                id: orgUnitLeaders.id,
                employeeId: orgUnitLeaders.employeeId,
                firstName: employees.firstName,
                lastName: employees.lastName,
                role: orgUnitLeaders.role,
                isPrimary: orgUnitLeaders.isPrimary,
            })
            .from(orgUnitLeaders)
            .innerJoin(employees, eq(orgUnitLeaders.employeeId, employees.id))
            .where(
                and(
                    eq(orgUnitLeaders.orgUnitId, empRow.orgUnitId),
                    isNull(orgUnitLeaders.deletedAt),
                    isNull(employees.deletedAt),
                )
            )

        return {
            employee: {
                id: empRow.id,
                firstName: empRow.firstName,
                lastName: empRow.lastName,
                employeeNo: empRow.employeeNo,
                hireDate: empRow.hireDate,
                status: empRow.status,
                employmentType: empRow.employmentType,
            },
            position: pos ? { id: pos.id, title: pos.title, code: pos.code } : null,
            orgUnit: org ? {
                id: org.id,
                name: org.name,
                code: org.code,
                path: buildPath(empRow.orgUnitId),
            } : null,
            supervisor,
            directReports,
            leaders,
        }
    }

    async getMyWorkSchedule(employeeId: string) {
        const [row] = await this.db.db
            .select({
                id: employeeShiftAssignments.id,
                startTime: employeeShiftAssignments.startTime,
                endTime: employeeShiftAssignments.endTime,
                breakMinutes: employeeShiftAssignments.breakMinutes,
                isFlexible: employeeShiftAssignments.isFlexible,
                isMon: employeeShiftAssignments.isMon,
                isTue: employeeShiftAssignments.isTue,
                isWed: employeeShiftAssignments.isWed,
                isThu: employeeShiftAssignments.isThu,
                isFri: employeeShiftAssignments.isFri,
                isSat: employeeShiftAssignments.isSat,
                isSun: employeeShiftAssignments.isSun,
                effectiveFrom: employeeShiftAssignments.effectiveFrom,
                templateName: shiftTemplates.name,
                templateCode: shiftTemplates.code,
            })
            .from(employeeShiftAssignments)
            .innerJoin(shiftTemplates, eq(employeeShiftAssignments.shiftTemplateId, shiftTemplates.id))
            .where(eq(employeeShiftAssignments.employeeId, employeeId))
            .limit(1)

        return row ?? null
    }

    async getMyAttendanceHistory(employeeId: string) {
        const since = new Date()
        since.setUTCDate(since.getUTCDate() - 30)
        const sinceStr = since.toISOString().slice(0, 10)

        return this.db.db
            .select({
                id: attendanceLogs.id,
                workDate: attendanceLogs.workDate,
                scheduledInAt: attendanceLogs.scheduledInAt,
                scheduledOutAt: attendanceLogs.scheduledOutAt,
                actualInAt: attendanceLogs.actualInAt,
                actualOutAt: attendanceLogs.actualOutAt,
                sourceIn: attendanceLogs.sourceIn,
                sourceOut: attendanceLogs.sourceOut,
                isLocked: attendanceLogs.isLocked,
            })
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    gte(attendanceLogs.workDate, sinceStr),
                ),
            )
            .orderBy(desc(attendanceLogs.workDate))
    }
}

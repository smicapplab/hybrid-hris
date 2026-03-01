import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { employees, employeeProfiles } from '@hybrid-hris/db'
import { DatabaseService } from 'src/database/database.service'
import { UpdateMyProfileDto } from './dto/update-my-profile.dto'

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
}

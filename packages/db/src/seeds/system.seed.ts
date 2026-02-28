import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { roles } from '../schema/roles';
import { SystemRole } from '@hybrid-hris/domain';
import { leaveTypes } from '../schema/leave-types';
import { employees } from '../schema/employees';
import { users } from '../schema/users';
import { userRoles } from '../schema/user-roles';
import { orgUnits } from '../schema/org-units';
import { positions } from '../schema/positions';
import { orgUnitPositions } from '../schema/org-unit-positions';
import { orgUnitLeaders } from '../schema/org-unit-leaders';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { hrSettings } from '../schema/hr-settings';
import { employeeProfiles } from '../schema/employee-profiles';
import { employeeIdentifiers } from '../schema/employee-identifiers';
import { shiftTemplates } from '../schema/shift-templates';
import { employeeShiftAssignments } from '../schema/employee-shift-assignments';


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function seedSystem() {
    console.log('Seeding system data...');
    const loadTestData = process.env.LOAD_TEST_DATA === 'true';
    console.log('LOAD_TEST_DATA:', process.env.LOAD_TEST_DATA);

    const todayIso = new Date().toISOString().slice(0, 10);

    function digitsOnly(value: string): string {
        return value.replace(/\D/g, '');
    }

    function padLeft(value: string, len: number, ch = '0'): string {
        if (value.length >= len) return value;
        return ch.repeat(len - value.length) + value;
    }

    function makeTin(employeeNo: string): string {
        // PH TIN commonly 9-12 digits; use 12 digits here for consistency
        const base = padLeft(digitsOnly(employeeNo), 12);
        return base.slice(0, 12);
    }

    function makeSss(employeeNo: string): string {
        // SSS is 10 digits; generate deterministic 10-digit value
        const base = padLeft(digitsOnly(employeeNo), 10);
        return base.slice(0, 10);
    }

    function makePhilHealth(employeeNo: string): string {
        // PhilHealth PIN is typically 12 digits
        const base = padLeft(digitsOnly(employeeNo), 12);
        return base.slice(0, 12);
    }

    function makePagIbig(employeeNo: string): string {
        // Pag-IBIG MID is typically 12 digits
        const base = padLeft(digitsOnly(employeeNo), 12);
        return base.slice(0, 12);
    }

    async function ensureEmployeeProfile(employeeId: string, employeeNo: string) {
        await db.insert(employeeProfiles)
            .values({
                employeeId,
                // Example demographic fields (adjust to your schema if names differ)
                mobileNo: `09${padLeft(digitsOnly(employeeNo), 9).slice(0, 9)}`,
                birthDate: '1990-01-01',
                gender: 'MALE',
                civilStatus: 'SINGLE',
                emergencyContactName: 'Emergency Contact',
                emergencyContactMobileNo: '09171234567',
            })
            .onConflictDoNothing();
    }

    async function ensureEmployeeIdentifiers(employeeId: string, employeeNo: string) {
        // NOTE: keep these key names aligned with `employeeIdentifiers` schema.
        // Common naming in the schema is `*No` suffix.
        const identifiers: typeof employeeIdentifiers.$inferInsert = {
            employeeId,
            tinNo: makeTin(employeeNo),
            sssNo: makeSss(employeeNo),
            philHealthNo: makePhilHealth(employeeNo),
            pagIbigNo: makePagIbig(employeeNo),
        };

        await db.insert(employeeIdentifiers)
            .values(identifiers)
            .onConflictDoNothing();
    }

    // ---- Roles ----
    await db.insert(roles).values([
        {
            code: SystemRole.HR_ADMIN,
            name: 'HR Administrator',
            description: 'Full HR system access including role management',
            isSystem: true,
        },
        {
            code: SystemRole.ADMIN,
            name: 'Administrator',
            description: 'General administrative access',
            isSystem: true,
        },
        {
            code: SystemRole.MANAGER,
            name: 'Manager',
            description: 'Department-level management access',
            isSystem: true,
        },
        {
            code: SystemRole.EMPLOYEE,
            name: 'Employee',
            description: 'Basic self-service access',
            isSystem: true,
        },
    ]).onConflictDoNothing();

    // ---- Default Leave Types ----
    await db.insert(leaveTypes).values([
        {
            code: 'VL',
            name: 'Vacation Leave',
            accrualRatePerMonth: '1.25',
            maxCarryOver: '5',
            isAccrualBased: true,
            isPaid: true,
        },
        {
            code: 'SL',
            name: 'Sick Leave',
            accrualRatePerMonth: '1.25',
            maxCarryOver: '0',
            isAccrualBased: true,
            isPaid: true,
        },
    ]).onConflictDoNothing();

    // ---- HR Settings (Singleton) ----
    await db.insert(hrSettings)
        .values({
            singleton: true,
            employeeNoPrefix: 'EMP-',
            employeeNoNext: 1005,
            employeeNoPadding: 4,
        })
        .onConflictDoNothing();

    // ---- Ensure Root Org ----
    let rootOrg = (
        await db.insert(orgUnits)
            .values({
                name: 'Head Office',
                code: 'HO',
                isActive: true,
            })
            .onConflictDoNothing()
            .returning()
    )[0];

    if (!rootOrg) {
        rootOrg = (
            await db.select()
                .from(orgUnits)
                .where(eq(orgUnits.code, 'HO'))
        )[0];
    }

    // ---- Ensure Default Org + Position for Admin ----
    let defaultOrg = (
        await db.insert(orgUnits)
            .values({
                name: 'System Administration',
                code: 'SYS_ADMIN',
                parentId: rootOrg?.id ?? null,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning()
    )[0];

    if (!defaultOrg) {
        defaultOrg = (
            await db.select()
                .from(orgUnits)
                .where(eq(orgUnits.code, 'SYS_ADMIN'))
        )[0];
    }

    let defaultPosition = (
        await db.insert(positions)
            .values({
                code: 'SYSTEM_ADMIN',
                title: 'System Administrator',
                description: 'System administrative position',
                isActive: true,
            })
            .onConflictDoNothing()
            .returning()
    )[0];

    if (!defaultPosition) {
        defaultPosition = (
            await db.select()
                .from(positions)
                .where(eq(positions.code, 'SYSTEM_ADMIN'))
        )[0];
    }

    // ---- Default Shift Templates ----
    const [dayShift] = await db.insert(shiftTemplates)
        .values({
            code: 'DAY_SHIFT',
            name: 'Day Shift (9AM-6PM)',
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
            isFlexible: false,
            isActive: true,
        })
        .onConflictDoNothing()
        .returning();

    const [nightShift] = await db.insert(shiftTemplates)
        .values({
            code: 'NIGHT_SHIFT',
            name: 'Night Shift (10PM-6AM)',
            startTime: '22:00',
            endTime: '06:00',
            breakMinutes: 60,
            isFlexible: false,
            isActive: true,
        })
        .onConflictDoNothing()
        .returning();

    const resolvedDayShift = dayShift ?? (
        await db.select().from(shiftTemplates).where(eq(shiftTemplates.code, 'DAY_SHIFT'))
    )[0];

    const resolvedNightShift = nightShift ?? (
        await db.select().from(shiftTemplates).where(eq(shiftTemplates.code, 'NIGHT_SHIFT'))
    )[0];

    // ---- Initial Admin Employee ----
    let adminEmployeeId: string | undefined;

    const insertedEmployees = await db.insert(employees)
        .values({
            employeeNo: 'EMP-0001',
            firstName: 'System',
            lastName: 'Administrator',
            hireDate: todayIso,
            employmentType: 'REGULAR',
            status: 'ACTIVE',
            orgUnitId: defaultOrg?.id,
            positionId: defaultPosition?.id,
        })
        .onConflictDoNothing()
        .returning();

    if (insertedEmployees.length > 0) {
        adminEmployeeId = insertedEmployees[0].id;
    } else {
        const existingEmployee = await db.select()
            .from(employees)
            .where(eq(employees.employeeNo, 'EMP-0001'));
        adminEmployeeId = existingEmployee[0]?.id;
    }
    if (adminEmployeeId) {
        await ensureEmployeeProfile(adminEmployeeId, 'EMP-0001');
        await ensureEmployeeIdentifiers(adminEmployeeId, 'EMP-0001');
    }

    // ---- Assign Day Shift to Admin Employee ----
    if (adminEmployeeId && resolvedDayShift) {
        await db.insert(employeeShiftAssignments)
            .values({
                employeeId: adminEmployeeId,
                shiftTemplateId: resolvedDayShift.id,
                startTime: resolvedDayShift.startTime,
                endTime: resolvedDayShift.endTime,
                breakMinutes: resolvedDayShift.breakMinutes,
                isFlexible: resolvedDayShift.isFlexible,
                isMon: resolvedDayShift.isMon,
                isTue: resolvedDayShift.isTue,
                isWed: resolvedDayShift.isWed,
                isThu: resolvedDayShift.isThu,
                isFri: resolvedDayShift.isFri,
                isSat: resolvedDayShift.isSat,
                isSun: resolvedDayShift.isSun,
                effectiveFrom: todayIso,
            })
            .onConflictDoNothing();
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);

    // Fetch HR_ADMIN role
    const [adminRole] = await db.select()
        .from(roles)
        .where(eq(roles.code, 'HR_ADMIN'));

    // ---- Initial Admin User ----
    let adminUserId: string | undefined;

    const insertedUsers = await db.insert(users)
        .values({
            employeeId: adminEmployeeId,
            email: 'admin@hybrid-hris.local',
            passwordHash,
            isActive: true,
        })
        .onConflictDoNothing()
        .returning();

    if (insertedUsers.length > 0) {
        adminUserId = insertedUsers[0].id;
    } else {
        const existing = await db.select()
            .from(users)
            .where(eq(users.email, 'admin@hybrid-hris.local'));
        adminUserId = existing[0]?.id;
    }

    // Attach ADMIN role
    if (adminUserId && adminRole) {
        await db.insert(userRoles)
            .values({
                userId: adminUserId,
                roleId: adminRole.id,
            })
            .onConflictDoNothing();
    }

    // ---- Assign System Admin as Leader of System Administration ----
    if (adminEmployeeId && defaultOrg) {
        await db.insert(orgUnitLeaders)
            .values({
                orgUnitId: defaultOrg.id,
                employeeId: adminEmployeeId,
                role: 'HEAD',
                effectiveFrom: todayIso,
            })
            .onConflictDoNothing();
    }

    // ---- Optional Test Org Structure ----
    if (loadTestData) {
        console.log('Loading test organizational data...');

        let rootOrg = (
            await db.insert(orgUnits)
                .values({
                    name: 'Head Office',
                    code: 'HO',
                    isActive: true,
                })
                .onConflictDoNothing()
                .returning()
        )[0];

        if (!rootOrg) {
            rootOrg = (
                await db.select()
                    .from(orgUnits)
                    .where(eq(orgUnits.code, 'HO'))
            )[0];
        }

        const [hrOrg] = await db.insert(orgUnits)
            .values({
                name: 'Human Resources',
                code: 'HR',
                parentId: rootOrg?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        // ---- HR Sub Units ----
        const [hrRecruitment] = await db.insert(orgUnits)
            .values({
                name: 'HR Recruitment',
                code: 'HR_REC',
                parentId: hrOrg?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        const [hrOperations] = await db.insert(orgUnits)
            .values({
                name: 'HR Operations',
                code: 'HR_OPS',
                parentId: hrOrg?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        let managerPosition = (
            await db.insert(positions)
                .values({
                    code: 'HR_MANAGER',
                    title: 'HR Manager',
                    description: 'Manages HR department',
                    isActive: true,
                })
                .onConflictDoNothing()
                .returning()
        )[0];

        if (!managerPosition) {
            managerPosition = (
                await db.select()
                    .from(positions)
                    .where(eq(positions.code, 'HR_MANAGER'))
            )[0];
        }

        if (hrOrg && managerPosition) {
            await db.insert(orgUnitPositions)
                .values({
                    orgUnitId: hrOrg.id,
                    positionId: managerPosition.id,
                })
                .onConflictDoNothing();
        }

        // Assign manager position to HR sub-units
        if (managerPosition) {
            for (const unit of [hrRecruitment, hrOperations]) {
                if (!unit) continue;

                await db.insert(orgUnitPositions)
                    .values({
                        orgUnitId: unit.id,
                        positionId: managerPosition.id,
                    })
                    .onConflictDoNothing();
            }
        }

        // ---- Additional Org Units ----
        const [itOrg] = await db.insert(orgUnits)
            .values({
                name: 'Information Technology',
                code: 'IT',
                parentId: rootOrg?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        // ---- IT Sub Units ----
        const [itEngineering] = await db.insert(orgUnits)
            .values({
                name: 'IT Engineering',
                code: 'IT_ENG',
                parentId: itOrg?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        const [itSupport] = await db.insert(orgUnits)
            .values({
                name: 'IT Support',
                code: 'IT_SUP',
                parentId: itOrg?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        // ---- Additional Positions ----
        let devPosition = (
            await db.insert(positions)
                .values({
                    code: 'SOFTWARE_ENGINEER',
                    title: 'Software Engineer',
                    description: 'Develops and maintains systems',
                    isActive: true,
                })
                .onConflictDoNothing()
                .returning()
        )[0];

        if (!devPosition) {
            devPosition = (
                await db.select()
                    .from(positions)
                    .where(eq(positions.code, 'SOFTWARE_ENGINEER'))
            )[0];
        }

        let itManagerPosition = (
            await db.insert(positions)
                .values({
                    code: 'IT_MANAGER',
                    title: 'IT Manager',
                    description: 'Leads IT department',
                    isActive: true,
                })
                .onConflictDoNothing()
                .returning()
        )[0];

        if (!itManagerPosition) {
            itManagerPosition = (
                await db.select()
                    .from(positions)
                    .where(eq(positions.code, 'IT_MANAGER'))
            )[0];
        }

        // Map positions to org units
        if (itOrg && devPosition) {
            await db.insert(orgUnitPositions)
                .values({ orgUnitId: itOrg.id, positionId: devPosition.id })
                .onConflictDoNothing();
        }

        if (itOrg && itManagerPosition) {
            await db.insert(orgUnitPositions)
                .values({ orgUnitId: itOrg.id, positionId: itManagerPosition.id })
                .onConflictDoNothing();
        }

        // Allow multiple positions in IT sub-units
        if (devPosition || itManagerPosition) {
            for (const unit of [itEngineering, itSupport]) {
                if (!unit) continue;

                if (devPosition) {
                    await db.insert(orgUnitPositions)
                        .values({
                            orgUnitId: unit.id,
                            positionId: devPosition.id,
                        })
                        .onConflictDoNothing();
                }

                if (itManagerPosition) {
                    await db.insert(orgUnitPositions)
                        .values({
                            orgUnitId: unit.id,
                            positionId: itManagerPosition.id,
                        })
                        .onConflictDoNothing();
                }
            }
        }

        // ---- Sample Employees ----
        const [hrManagerEmployee] = await db.insert(employees)
            .values({
                employeeNo: 'EMP-1001',
                firstName: 'Alice',
                lastName: 'Santos',
                hireDate: todayIso,
                employmentType: 'REGULAR',
                status: 'ACTIVE',
                orgUnitId: hrOrg?.id,
                positionId: managerPosition?.id,
                supervisorId: null,
            })
            .onConflictDoNothing()
            .returning();

        if (hrManagerEmployee) {
            await ensureEmployeeProfile(hrManagerEmployee.id, hrManagerEmployee.employeeNo);
            await ensureEmployeeIdentifiers(hrManagerEmployee.id, hrManagerEmployee.employeeNo);
        }

        // Assign Day Shift to HR Manager
        if (resolvedDayShift) {
            await db.insert(employeeShiftAssignments)
                .values({
                    employeeId: hrManagerEmployee.id,
                    shiftTemplateId: resolvedDayShift.id,
                    startTime: resolvedDayShift.startTime,
                    endTime: resolvedDayShift.endTime,
                    breakMinutes: resolvedDayShift.breakMinutes,
                    isFlexible: resolvedDayShift.isFlexible,
                    isMon: resolvedDayShift.isMon,
                    isTue: resolvedDayShift.isTue,
                    isWed: resolvedDayShift.isWed,
                    isThu: resolvedDayShift.isThu,
                    isFri: resolvedDayShift.isFri,
                    isSat: resolvedDayShift.isSat,
                    isSun: resolvedDayShift.isSun,
                    effectiveFrom: todayIso,
                })
                .onConflictDoNothing();
        }

        if (hrManagerEmployee && hrOrg) {
            await db.insert(orgUnitLeaders)
                .values({
                    orgUnitId: hrOrg.id,
                    employeeId: hrManagerEmployee.id,
                    role: 'HEAD',
                    effectiveFrom: todayIso,
                })
                .onConflictDoNothing();
        }

        const [itManagerEmployee] = await db.insert(employees)
            .values({
                employeeNo: 'EMP-1002',
                firstName: 'Mark',
                lastName: 'Reyes',
                hireDate: todayIso,
                employmentType: 'REGULAR',
                status: 'ACTIVE',
                orgUnitId: itOrg?.id,
                positionId: itManagerPosition?.id,
                supervisorId: null,
            })
            .onConflictDoNothing()
            .returning();

        if (itManagerEmployee) {
            await ensureEmployeeProfile(itManagerEmployee.id, itManagerEmployee.employeeNo);
            await ensureEmployeeIdentifiers(itManagerEmployee.id, itManagerEmployee.employeeNo);
        }

        // Assign Day Shift to IT Manager
        if (resolvedDayShift) {
            await db.insert(employeeShiftAssignments)
                .values({
                    employeeId: itManagerEmployee.id,
                    shiftTemplateId: resolvedDayShift.id,
                    startTime: resolvedDayShift.startTime,
                    endTime: resolvedDayShift.endTime,
                    breakMinutes: resolvedDayShift.breakMinutes,
                    isFlexible: resolvedDayShift.isFlexible,
                    isMon: resolvedDayShift.isMon,
                    isTue: resolvedDayShift.isTue,
                    isWed: resolvedDayShift.isWed,
                    isThu: resolvedDayShift.isThu,
                    isFri: resolvedDayShift.isFri,
                    isSat: resolvedDayShift.isSat,
                    isSun: resolvedDayShift.isSun,
                    effectiveFrom: todayIso,
                })
                .onConflictDoNothing();
        }

        if (itManagerEmployee && itOrg) {
            await db.insert(orgUnitLeaders)
                .values({
                    orgUnitId: itOrg.id,
                    employeeId: itManagerEmployee.id,
                    role: 'HEAD',
                    effectiveFrom: todayIso,
                })
                .onConflictDoNothing();
        }

        // Developers reporting to IT Manager
        if (itManagerEmployee) {
            await db.insert(employees)
                .values([
                    {
                        employeeNo: 'EMP-1003',
                        firstName: 'John',
                        lastName: 'Dela Cruz',
                        hireDate: todayIso,
                        employmentType: 'REGULAR',
                        status: 'ACTIVE',
                        orgUnitId: itEngineering?.id,
                        positionId: devPosition?.id,
                        supervisorId: itManagerEmployee.id,
                    },
                    {
                        employeeNo: 'EMP-1004',
                        firstName: 'Jane',
                        lastName: 'Lopez',
                        hireDate: todayIso,
                        employmentType: 'REGULAR',
                        status: 'ACTIVE',
                        orgUnitId: itEngineering?.id,
                        positionId: devPosition?.id,
                        supervisorId: itManagerEmployee.id,
                    },
                ])
                .onConflictDoNothing();

            const insertedDevs = await db.select()
                .from(employees)
                .where(eq(employees.orgUnitId, itEngineering!.id));

            for (const dev of insertedDevs) {
                if (!dev?.id) continue;
                if (dev.employeeNo !== 'EMP-1003' && dev.employeeNo !== 'EMP-1004') continue;
                await ensureEmployeeProfile(dev.id, dev.employeeNo);
                await ensureEmployeeIdentifiers(dev.id, dev.employeeNo);
                // Assign Day Shift to Developers
                if (resolvedDayShift) {
                    await db.insert(employeeShiftAssignments)
                        .values({
                            employeeId: dev.id,
                            shiftTemplateId: resolvedDayShift.id,
                            startTime: resolvedDayShift.startTime,
                            endTime: resolvedDayShift.endTime,
                            breakMinutes: resolvedDayShift.breakMinutes,
                            isFlexible: resolvedDayShift.isFlexible,
                            isMon: resolvedDayShift.isMon,
                            isTue: resolvedDayShift.isTue,
                            isWed: resolvedDayShift.isWed,
                            isThu: resolvedDayShift.isThu,
                            isFri: resolvedDayShift.isFri,
                            isSat: resolvedDayShift.isSat,
                            isSun: resolvedDayShift.isSun,
                            effectiveFrom: todayIso,
                        })
                        .onConflictDoNothing();
                }
            }
        }

        // ---- Create Users for Sample Employees ----
        const defaultPassword = await bcrypt.hash('Password123!', 10);

        const allSampleEmployees = await db.select()
            .from(employees)
            .where(
                eq(employees.status, 'ACTIVE')
            );

        const [managerRole] = await db.select()
            .from(roles)
            .where(eq(roles.code, 'MANAGER'));

        const [employeeRole] = await db.select()
            .from(roles)
            .where(eq(roles.code, 'EMPLOYEE'));

        for (const emp of allSampleEmployees) {
            if (emp.employeeNo === 'EMP-0001') continue; // skip system admin

            const insertedUser = await db.insert(users)
                .values({
                    employeeId: emp.id,
                    email: `${emp.employeeNo.toLowerCase()}@hybrid-hris.local`,
                    passwordHash: defaultPassword,
                    isActive: true,
                })
                .onConflictDoNothing()
                .returning();

            const userId = insertedUser[0]?.id ?? (
                await db.select()
                    .from(users)
                    .where(eq(users.employeeId, emp.id))
            )[0]?.id;

            if (!userId) continue;

            const isManager = ['EMP-1001', 'EMP-1002'].includes(emp.employeeNo);

            const roleToAssign = isManager ? managerRole : employeeRole;

            if (roleToAssign) {
                await db.insert(userRoles)
                    .values({
                        userId,
                        roleId: roleToAssign.id,
                    })
                    .onConflictDoNothing();
            }

            // Assign Org Unit Leaders for Managers
            if (isManager) {
                await db.insert(orgUnitLeaders)
                    .values({
                        orgUnitId: emp.orgUnitId,
                        employeeId: emp.id,
                        role: 'HEAD',
                        effectiveFrom: todayIso,
                    })
                    .onConflictDoNothing();
            }
        }
    }

    console.log('System seed completed.');
}
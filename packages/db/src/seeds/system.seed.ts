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


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function seedSystem() {
    console.log('Seeding system data...');
    const loadTestData = process.env.LOAD_TEST_DATA === 'true';
    console.log('LOAD_TEST_DATA:', process.env.LOAD_TEST_DATA);

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

    // ---- Initial Admin Employee ----
    let adminEmployeeId: string | undefined;

    const insertedEmployees = await db.insert(employees)
        .values({
            employeeNo: 'EMP-0001',
            firstName: 'System',
            lastName: 'Administrator',
            hireDate: new Date().toISOString().slice(0, 10),
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
                effectiveFrom: new Date().toISOString().slice(0, 10),
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
                hireDate: new Date().toISOString().slice(0, 10),
                employmentType: 'REGULAR',
                status: 'ACTIVE',
                orgUnitId: hrOrg?.id,
                positionId: managerPosition?.id,
                supervisorId: null,
            })
            .onConflictDoNothing()
            .returning();

        if (hrManagerEmployee && hrOrg) {
            await db.insert(orgUnitLeaders)
                .values({
                    orgUnitId: hrOrg.id,
                    employeeId: hrManagerEmployee.id,
                    role: 'HEAD',
                    effectiveFrom: new Date().toISOString().slice(0, 10),
                })
                .onConflictDoNothing();
        }

        const [itManagerEmployee] = await db.insert(employees)
            .values({
                employeeNo: 'EMP-1002',
                firstName: 'Mark',
                lastName: 'Reyes',
                hireDate: new Date().toISOString().slice(0, 10),
                employmentType: 'REGULAR',
                status: 'ACTIVE',
                orgUnitId: itOrg?.id,
                positionId: itManagerPosition?.id,
                supervisorId: null,
            })
            .onConflictDoNothing()
            .returning();

        if (itManagerEmployee && itOrg) {
            await db.insert(orgUnitLeaders)
                .values({
                    orgUnitId: itOrg.id,
                    employeeId: itManagerEmployee.id,
                    role: 'HEAD',
                    effectiveFrom: new Date().toISOString().slice(0, 10),
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
                        hireDate: new Date().toISOString().slice(0, 10),
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
                        hireDate: new Date().toISOString().slice(0, 10),
                        employmentType: 'REGULAR',
                        status: 'ACTIVE',
                        orgUnitId: itEngineering?.id,
                        positionId: devPosition?.id,
                        supervisorId: itManagerEmployee.id,
                    },
                ])
                .onConflictDoNothing();
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
                        effectiveFrom: new Date().toISOString().slice(0, 10),
                    })
                    .onConflictDoNothing();
            }
        }
    }

    console.log('System seed completed.');
}
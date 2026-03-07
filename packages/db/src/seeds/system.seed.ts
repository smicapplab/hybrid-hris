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
import { eq, InferSelectModel } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { hrSettings } from '../schema/hr-settings';
import { employeeProfiles } from '../schema/employee-profiles';
import { employeeIdentifiers } from '../schema/employee-identifiers';
import { shiftTemplates } from '../schema/shift-templates';
import { employeeShiftAssignments } from '../schema/employee-shift-assignments';
import { leaveRequests } from '../schema/leave-requests';
import { leaveRequestApprovals } from '../schema/leave-request-approvals';
import { leaveLedger } from '../schema/leave-ledger';
import { leavePolicies } from '../schema/leave-policies';
import { leavePolicyRules } from '../schema/leave-policy-rules';
import { employeeLeavePolicies } from '../schema/employee-leave-policies';
import { expenseCategories } from '../schema/expense-categories';
import { budgetPeriods } from '../schema/budget-periods';
import { orgUnitBudgets } from '../schema/org-unit-budgets';
import { budgetLedger } from '../schema/budget-ledger';


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function seedSystem() {
    console.log('Seeding system data...');
    const loadTestData = process.env.LOAD_TEST_DATA === 'true';
    console.log('LOAD_TEST_DATA:', process.env.LOAD_TEST_DATA);

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    function digitsOnly(value: string): string {
        return value.replace(/\D/g, '');
    }

    function padLeft(value: string, len: number, ch = '0'): string {
        if (value.length >= len) return value;
        return ch.repeat(len - value.length) + value;
    }

    function makeTin(employeeNo: string): string {
        const base = padLeft(digitsOnly(employeeNo), 12);
        return base.slice(0, 12);
    }

    function makeSss(employeeNo: string): string {
        const base = padLeft(digitsOnly(employeeNo), 10);
        return base.slice(0, 10);
    }

    function makePhilHealth(employeeNo: string): string {
        const base = padLeft(digitsOnly(employeeNo), 12);
        return base.slice(0, 12);
    }

    function makePagIbig(employeeNo: string): string {
        const base = padLeft(digitsOnly(employeeNo), 12);
        return base.slice(0, 12);
    }

    async function ensureEmployeeProfile(employeeId: string, employeeNo: string) {
        await db.insert(employeeProfiles)
            .values({
                employeeId,
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
    const leaveTypesData = [
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
    ];

    for (const lt of leaveTypesData) {
        await db.insert(leaveTypes).values(lt).onConflictDoNothing();
    }

    const allLeaveTypes = await db.select().from(leaveTypes);
    const vlType = allLeaveTypes.find(t => t.code === 'VL');
    const slType = allLeaveTypes.find(t => t.code === 'SL');

    // ---- Standard Leave Policy ----
    let [standardPolicy] = await db.insert(leavePolicies)
        .values({
            code: 'STD_POLICY',
            name: 'Standard Leave Policy',
            description: 'Standard leave policy with 15 days VL and 15 days SL per year',
            isDefault: true,
            isActive: true,
            effectiveFrom: '2024-01-01',
        })
        .onConflictDoNothing()
        .returning();

    if (!standardPolicy) {
        standardPolicy = (await db.select().from(leavePolicies).where(eq(leavePolicies.code, 'STD_POLICY')))[0];
    }

    if (standardPolicy) {
        // Rules for Standard Policy
        if (vlType) {
            await db.insert(leavePolicyRules)
                .values({
                    policyId: standardPolicy.id,
                    leaveTypeId: vlType.id,
                    accrualMethod: 'MONTHLY',
                    accrualRatePerMonth: '1.2500', // 15 days / 12 months
                    maxBalance: '30.0000',
                    maxCarryOver: '10.0000',
                })
                .onConflictDoNothing();
        }
        if (slType) {
            await db.insert(leavePolicyRules)
                .values({
                    policyId: standardPolicy.id,
                    leaveTypeId: slType.id,
                    accrualMethod: 'MONTHLY',
                    accrualRatePerMonth: '1.2500',
                    maxBalance: '15.0000',
                    maxCarryOver: '0.0000',
                })
                .onConflictDoNothing();
        }
    }

    // ---- Intern Leave Policy ----
    let [internPolicy] = await db.insert(leavePolicies)
        .values({
            code: 'INTERN_POLICY',
            name: 'Intern Leave Policy',
            description: 'Reduced leave entitlements for interns (6 days VL/year)',
            isDefault: false,
            isActive: true,
            effectiveFrom: '2024-01-01',
        })
        .onConflictDoNothing()
        .returning();

    if (!internPolicy) {
        internPolicy = (await db.select().from(leavePolicies).where(eq(leavePolicies.code, 'INTERN_POLICY')))[0];
    }

    if (internPolicy) {
        if (vlType) {
            await db.insert(leavePolicyRules)
                .values({
                    policyId: internPolicy.id,
                    leaveTypeId: vlType.id,
                    accrualMethod: 'MONTHLY',
                    accrualRatePerMonth: '0.5000', // 6 days / 12 months
                    maxBalance: '6.0000',
                    maxCarryOver: '0.0000',
                })
                .onConflictDoNothing();
        }
    }

    // ---- HR Settings (Singleton) ----
    await db.insert(hrSettings)
        .values({
            singleton: true,
            employeeNoPrefix: 'EMP-',
            employeeNoNext: 1005,
            employeeNoPadding: 6,
        })
        .onConflictDoUpdate({
            target: hrSettings.singleton,
            set: { employeeNoPadding: 6, updatedAt: new Date() },
        });

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

    // Ensure mapping exists so admin can be updated
    if (defaultOrg && defaultPosition) {
        await db.insert(orgUnitPositions)
            .values({ orgUnitId: defaultOrg.id, positionId: defaultPosition.id })
            .onConflictDoNothing();
    }

    // ---- More Org Units and Positions for testing ----
    const engineeringOrg = (await db.insert(orgUnits).values({
        name: 'Engineering',
        code: 'ENG',
        parentId: rootOrg?.id,
        isActive: true,
    }).onConflictDoNothing().returning())[0] || (await db.select().from(orgUnits).where(eq(orgUnits.code, 'ENG')))[0];

    const ctoPos = (await db.insert(positions).values({
        code: 'CTO',
        title: 'Chief Technology Officer',
        isActive: true,
    }).onConflictDoNothing().returning())[0] || (await db.select().from(positions).where(eq(positions.code, 'CTO')))[0];

    const leadEngPos = (await db.insert(positions).values({
        code: 'LEAD_ENG',
        title: 'Lead Engineer',
        isActive: true,
    }).onConflictDoNothing().returning())[0] || (await db.select().from(positions).where(eq(positions.code, 'LEAD_ENG')))[0];

    if (engineeringOrg) {
        if (ctoPos) await db.insert(orgUnitPositions).values({ orgUnitId: engineeringOrg.id, positionId: ctoPos.id }).onConflictDoNothing();
        if (leadEngPos) await db.insert(orgUnitPositions).values({ orgUnitId: engineeringOrg.id, positionId: leadEngPos.id }).onConflictDoNothing();
    }

    const hrOrg = (await db.insert(orgUnits).values({
        name: 'Human Resources',
        code: 'HR',
        parentId: rootOrg?.id,
        isActive: true,
    }).onConflictDoNothing().returning())[0] || (await db.select().from(orgUnits).where(eq(orgUnits.code, 'HR')))[0];

    const hrMgrPos = (await db.insert(positions).values({
        code: 'HR_MGR',
        title: 'HR Manager',
        isActive: true,
    }).onConflictDoNothing().returning())[0] || (await db.select().from(positions).where(eq(positions.code, 'HR_MGR')))[0];

    if (hrOrg && hrMgrPos) {
        await db.insert(orgUnitPositions).values({ orgUnitId: hrOrg.id, positionId: hrMgrPos.id }).onConflictDoNothing();
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

    const resolvedDayShift = dayShift ?? (
        await db.select().from(shiftTemplates).where(eq(shiftTemplates.code, 'DAY_SHIFT'))
    )[0];

    // ---- Initial Admin Employee ----
    let adminEmployeeId: string | undefined;

    const insertedEmployees = await db.insert(employees)
        .values({
            employeeNo: 'EMP-000001',
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
            .where(eq(employees.employeeNo, 'EMP-000001'));
        adminEmployeeId = existingEmployee[0]?.id;
    }
    if (adminEmployeeId) {
        await ensureEmployeeProfile(adminEmployeeId, 'EMP-000001');
        await ensureEmployeeIdentifiers(adminEmployeeId, 'EMP-000001');

        // Assign Standard Leave Policy
        if (standardPolicy) {
            await db.insert(employeeLeavePolicies)
                .values({
                    employeeId: adminEmployeeId,
                    policyId: standardPolicy.id,
                    effectiveFrom: todayIso,
                })
                .onConflictDoNothing();
        }
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
                isMon: true,
                isTue: true,
                isWed: true,
                isThu: true,
                isFri: true,
                isSat: true,
                isSun: true,
                effectiveFrom: todayIso,
            })
            .onConflictDoUpdate({
                target: employeeShiftAssignments.employeeId,
                set: {
                    isMon: true,
                    isTue: true,
                    isWed: true,
                    isThu: true,
                    isFri: true,
                    isSat: true,
                    isSun: true,
                    updatedAt: new Date(),
                },
            });
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const pinHash = await bcrypt.hash('123456', 10);

    // Fetch roles
    const [adminRole] = await db.select().from(roles).where(eq(roles.code, 'HR_ADMIN'));
    const [managerRole] = await db.select().from(roles).where(eq(roles.code, 'MANAGER'));
    const [employeeRole] = await db.select().from(roles).where(eq(roles.code, 'EMPLOYEE'));

    // ---- Initial Admin User ----
    let adminUserId: string | undefined;

    const insertedUsers = await db.insert(users)
        .values({
            employeeId: adminEmployeeId,
            email: 'admin@hybrid-hris.local',
            passwordHash,
            attendancePinHash: pinHash,
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

    // ---- Test Data for Pagination and Approvals ----
    if (loadTestData) {
        console.log('Loading test organizational data and leave requests...');

        // Create a dedicated team under Admin
        const [teamOrg] = await db.insert(orgUnits)
            .values({
                name: 'Managed Team',
                code: 'MNG_TEAM',
                parentId: rootOrg?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        const resolvedTeamOrg = teamOrg || (await db.select().from(orgUnits).where(eq(orgUnits.code, 'MNG_TEAM')))[0];

        let devPosition = (await db.select().from(positions).where(eq(positions.code, 'SOFTWARE_ENGINEER')))[0];
        if (!devPosition) {
            [devPosition] = await db.insert(positions)
                .values({
                    code: 'SOFTWARE_ENGINEER',
                    title: 'Software Engineer',
                    isActive: true,
                })
                .onConflictDoNothing()
                .returning();
        }

        if (resolvedTeamOrg && devPosition) {
            await db.insert(orgUnitPositions)
                .values({ orgUnitId: resolvedTeamOrg.id, positionId: devPosition.id })
                .onConflictDoNothing();
        }

        const teamMembers = [];
        // Create 15 team members reporting to Admin
        for (let i = 1; i <= 15; i++) {
            const empNo = `EMP-TEAM-${padLeft(i.toString(), 3)}`;
            let [emp] = await db.insert(employees)
                .values({
                    employeeNo: empNo,
                    firstName: `TeamMember`,
                    lastName: `${i}`,
                    hireDate: todayIso,
                    employmentType: 'REGULAR',
                    status: 'ACTIVE',
                    orgUnitId: resolvedTeamOrg?.id,
                    positionId: devPosition?.id,
                    supervisorId: adminEmployeeId, // Reports to Admin
                })
                .onConflictDoNothing()
                .returning();

            if (!emp) {
                emp = (await db.select().from(employees).where(eq(employees.employeeNo, empNo)))[0];
            }

            if (emp) {
                teamMembers.push(emp);
                await ensureEmployeeProfile(emp.id, emp.employeeNo);
                await ensureEmployeeIdentifiers(emp.id, emp.employeeNo);

                // Create User
                let [usr] = await db.insert(users)
                    .values({
                        employeeId: emp.id,
                        email: `${emp.employeeNo.toLowerCase()}@hybrid-hris.local`,
                        passwordHash: passwordHash,
                        isActive: true,
                    })
                    .onConflictDoNothing()
                    .returning();

                if (!usr) {
                    usr = (await db.select().from(users).where(eq(users.employeeId, emp.id)))[0];
                }

                if (usr && employeeRole) {
                    await db.insert(userRoles)
                        .values({ userId: usr.id, roleId: employeeRole.id })
                        .onConflictDoNothing();
                }

                // Assign Standard Leave Policy
                if (standardPolicy) {
                    await db.insert(employeeLeavePolicies)
                        .values({
                            employeeId: emp.id,
                            policyId: standardPolicy.id,
                            effectiveFrom: emp.hireDate,
                        })
                        .onConflictDoNothing();
                }

                // Initial Accrual for VL and SL (10 days each)
                if (vlType && slType) {
                    for (const lt of [vlType, slType]) {
                        await db.insert(leaveLedger)
                            .values({
                                employeeId: emp.id,
                                leaveTypeId: lt.id,
                                entryType: 'ACCRUAL',
                                amount: '10.0000',
                                balance: '10.0000',
                                accrualKey: 'INITIAL_SEED',
                            })
                            .onConflictDoNothing();
                    }
                }
            }
        }

        // Create various leave requests for these team members
        if (adminUserId && vlType && slType) {
            for (let i = 0; i < teamMembers.length; i++) {
                const emp = teamMembers[i];
                const isPending = i < 8; // First 8 are pending
                const isApproved = i >= 8 && i < 12; // Next 4 approved
                const isRejected = i >= 12; // Last 3 rejected

                const startDate = new Date(today);
                startDate.setDate(today.getDate() + (i + 1));
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 1);

                const [req] = await db.insert(leaveRequests)
                    .values({
                        employeeId: emp.id,
                        leaveTypeId: i % 2 === 0 ? vlType.id : slType.id,
                        startDate: startDate.toISOString().slice(0, 10),
                        endDate: endDate.toISOString().slice(0, 10),
                        days: '2.0000',
                        status: isPending ? 'PENDING' : (isApproved ? 'APPROVED' : 'REJECTED'),
                        notes: `Sample request from team member ${i + 1}`,
                        approvedBy: (isApproved || isRejected) ? adminUserId : null,
                        approvedAt: (isApproved || isRejected) ? new Date() : null,
                    })
                    .returning();

                if (req) {
                    // Create approval record
                    await db.insert(leaveRequestApprovals)
                        .values({
                            leaveRequestId: req.id,
                            approverUserId: adminUserId,
                            level: 1,
                            status: isPending ? 'PENDING' : (isApproved ? 'APPROVED' : 'REJECTED'),
                            actedAt: (isApproved || isRejected) ? new Date() : null,
                            remarks: (isApproved || isRejected) ? 'Processed via seed' : null,
                        })
                        .onConflictDoNothing();

                    // If approved, add consumption entry to ledger
                    if (isApproved) {
                        const ltId = i % 2 === 0 ? vlType.id : slType.id;
                        await db.insert(leaveLedger)
                            .values({
                                employeeId: emp.id,
                                leaveTypeId: ltId,
                                entryType: 'CONSUMPTION',
                                amount: '-2.0000',
                                balance: '8.0000',
                                referenceLeaveRequestId: req.id,
                            });
                    }
                }
            }
        }
    }

    await seedExpenses(db);

    console.log('System seed completed.');
}

async function seedExpenses(db: any) {
    console.log('Seeding expense and budget data...');

    const categories = [
        { code: 'TRAVEL', name: 'Travel' },
        { code: 'MEALS', name: 'Meals & Entertainment' },
        { code: 'HARDWARE', name: 'Hardware & Equipment' },
        { code: 'SOFTWARE', name: 'Software Subscriptions' },
        { code: 'TRAINING', name: 'Training & Development' },
        { code: 'SUPPLIES', name: 'Office Supplies' },
    ];

    const insertedCats = [];
    for (const cat of categories) {
        const [c] = await db.insert(expenseCategories).values(cat).onConflictDoNothing().returning();
        insertedCats.push(c || (await db.select().from(expenseCategories).where(eq(expenseCategories.code, cat.code)))[0]);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const periods = [
        {
            code: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
            name: `${now.toLocaleString('default', { month: 'long' })} ${currentYear}`,
            periodStart: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
            periodEnd: new Date(currentYear, currentMonth, 0).toISOString().slice(0, 10),
            periodType: 'MONTHLY',
        },
        {
            code: `FY-${currentYear}`,
            name: `Fiscal Year ${currentYear}`,
            periodStart: `${currentYear}-01-01`,
            periodEnd: `${currentYear}-12-31`,
            periodType: 'ANNUAL',
        }
    ];

    const insertedPeriods = [];
    for (const p of periods) {
        const [per] = await db.insert(budgetPeriods).values(p).onConflictDoNothing().returning();
        insertedPeriods.push(per || (await db.select().from(budgetPeriods).where(eq(budgetPeriods.code, p.code)))[0]);
    }

    // Allocate initial budgets to some leaf org units
    const allOrgs = await db.select().from(orgUnits);
    const leafOrgs = allOrgs.filter((ou: InferSelectModel<typeof orgUnits>) =>
        !allOrgs.some((child: InferSelectModel<typeof orgUnits>) => child.parentId === ou.id)
    );

    const monthlyPeriod = insertedPeriods.find(p => p.periodType === 'MONTHLY');
    const travelCat = insertedCats.find(c => c.code === 'TRAVEL');
    const mealsCat = insertedCats.find(c => c.code === 'MEALS');

    if (monthlyPeriod && leafOrgs.length > 0) {
        for (const org of leafOrgs) {
            // Give every leaf team $1,000 for travel and $500 for meals
            if (travelCat) {
                await db.insert(orgUnitBudgets).values({
                    orgUnitId: org.id,
                    budgetPeriodId: monthlyPeriod.id,
                    expenseCategoryId: travelCat.id,
                    amountAllocated: '1000.00',
                }).onConflictDoNothing();

                await db.insert(budgetLedger).values({
                    orgUnitId: org.id,
                    budgetPeriodId: monthlyPeriod.id,
                    expenseCategoryId: travelCat.id,
                    entryType: 'ALLOCATION',
                    amount: '1000.00',
                }).onConflictDoNothing();
            }

            if (mealsCat) {
                await db.insert(orgUnitBudgets).values({
                    orgUnitId: org.id,
                    budgetPeriodId: monthlyPeriod.id,
                    expenseCategoryId: mealsCat.id,
                    amountAllocated: '500.00',
                }).onConflictDoNothing();

                await db.insert(budgetLedger).values({
                    orgUnitId: org.id,
                    budgetPeriodId: monthlyPeriod.id,
                    expenseCategoryId: mealsCat.id,
                    entryType: 'ALLOCATION',
                    amount: '500.00',
                }).onConflictDoNothing();
            }
        }
    }
}
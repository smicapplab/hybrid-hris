import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { roles } from '../schema/roles';
import { SystemRole, BudgetPeriodType, BudgetLedgerEntryType } from '@hybrid-hris/domain';
import { leaveTypes } from '../schema/leave-types';
import { User } from '../types';
import { employees } from '../schema/employees';
import { users } from '../schema/users';
import { userRoles } from '../schema/user-roles';
import { orgUnits } from '../schema/org-units';
import { positions } from '../schema/positions';
import { orgUnitPositions } from '../schema/org-unit-positions';
import { orgUnitLeaders } from '../schema/org-unit-leaders';
import { eq, sql, isNull } from 'drizzle-orm';
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
import { attendanceLogs } from '../schema/attendance-logs';
import { manpowerRequests } from '../schema/manpower-requests';
import { manpowerRequestApprovals } from '../schema/manpower-request-approvals';
import { jobPostings } from '../schema/job-postings';
import { faker } from '@faker-js/faker';
import { seedSkillsEssential } from './skills-seed-essential';
import { seedSkillsDemo } from './skills-seed-demo';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function seedSystem() {
    console.log('🚀 Starting Enterprise Seed...');
    
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const pinHash = await bcrypt.hash('123456', 10);

    let adminUserObj: User | null = null;
    let hrUserObj: User | null = null;

    // --- 1. System Roles ---
    console.log('  - Seeding roles...');
    const systemRoles = [
        { code: SystemRole.HR_ADMIN, name: 'HR Administrator', description: 'Full HR access', isSystem: true },
        { code: SystemRole.ADMIN, name: 'Administrator', description: 'IT System access', isSystem: true },
        { code: SystemRole.MANAGER, name: 'Manager', description: 'Dept leadership', isSystem: true },
        { code: SystemRole.SUPERVISOR, name: 'Supervisor', description: 'Team lead', isSystem: true },
        { code: SystemRole.EMPLOYEE, name: 'Employee', description: 'Self-service', isSystem: true },
    ];
    await db.insert(roles).values(systemRoles).onConflictDoUpdate({
        target: roles.code,
        set: { name: sql`excluded.name`, updatedAt: new Date() }
    });

    // --- 2. Leave Config ---
    console.log('  - Seeding leave policies...');
    await db.insert(leaveTypes).values([
        { code: 'VL', name: 'Vacation Leave', accrualRatePerMonth: '1.25', maxCarryOver: '5', isAccrualBased: true, isPaid: true },
        { code: 'SL', name: 'Sick Leave', accrualRatePerMonth: '1.25', maxCarryOver: '0', isAccrualBased: true, isPaid: true },
    ]).onConflictDoNothing();

    const [vlType] = await db.select().from(leaveTypes).where(eq(leaveTypes.code, 'VL')).limit(1);
    const [slType] = await db.select().from(leaveTypes).where(eq(leaveTypes.code, 'SL')).limit(1);

    const [stdPolicy] = await db.insert(leavePolicies).values({
        code: 'STD_POLICY', name: 'Standard Leave Policy', isDefault: true, isActive: true, effectiveFrom: '2020-01-01'
    }).onConflictDoNothing().returning();

    const policyId = stdPolicy?.id || (await db.select().from(leavePolicies).where(eq(leavePolicies.code, 'STD_POLICY')))[0].id;

    if (vlType && slType) {
        await db.insert(leavePolicyRules).values([
            { policyId, leaveTypeId: vlType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '1.25', maxBalance: '30' },
            { policyId, leaveTypeId: slType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '1.25', maxBalance: '15' },
        ]).onConflictDoNothing();
    }

    // --- 3. Shift Templates ---
    console.log('  - Seeding shifts...');
    const [dayShift] = await db.insert(shiftTemplates).values({
        code: 'DAY_SHIFT', name: 'Standard Day (9AM-6PM)', startTime: '09:00', endTime: '18:00', breakMinutes: 60, isActive: true
    }).onConflictDoNothing().returning();
    const resolvedDayShift = dayShift || (await db.select().from(shiftTemplates).where(eq(shiftTemplates.code, 'DAY_SHIFT')))[0];

    // --- 4. HR Settings ---
    await db.insert(hrSettings).values({
        singleton: true,
        employeeNoPrefix: 'EMP-',
        employeeNoNext: 1000,
        employeeNoPadding: 6,
        passwordLoginEnabled: true,
        googleLoginEnabled: true,
        microsoftLoginEnabled: true
    }).onConflictDoUpdate({
        target: hrSettings.singleton,
        set: { 
            googleLoginEnabled: true, 
            microsoftLoginEnabled: true,
            updatedAt: new Date() 
        }
    });

    // --- 5. Organization Structure (3 Levels) ---
    console.log('  - Seeding organization tree...');
    
    // Level 1: Root
    const [rootOrg] = await db.insert(orgUnits).values({ name: 'Hybrid Corp Global', code: 'HQ', isActive: true }).onConflictDoNothing().returning();
    const hqId = rootOrg?.id || (await db.select().from(orgUnits).where(eq(orgUnits.code, 'HQ')))[0].id;

    // Level 2: Divisions
    const divisions = [
        { name: 'Corporate Services', code: 'CORP', parentId: hqId },
        { name: 'Engineering & Technology', code: 'ENG', parentId: hqId },
        { name: 'Operations & Logistics', code: 'OPS', parentId: hqId },
        { name: 'Sales & Marketing', code: 'SALES', parentId: hqId },
    ];
    for (const div of divisions) {
        await db.insert(orgUnits).values(div).onConflictDoNothing();
    }
    const allDivs = await db.select().from(orgUnits).where(eq(orgUnits.parentId, hqId));

    // Level 3: Departments
    const deptMap: Record<string, { name: string, code: string }[]> = {
        'CORP': [
            { name: 'Human Resources', code: 'HR' },
            { name: 'Finance & Accounting', code: 'FIN' },
            { name: 'Legal', code: 'LEGAL' }
        ],
        'ENG': [
            { name: 'Platform Engineering', code: 'PLAT' },
            { name: 'Product Development', code: 'PROD' },
            { name: 'Quality Assurance', code: 'QA' },
            { name: 'Data Science', code: 'DATA' }
        ],
        'OPS': [
            { name: 'Supply Chain', code: 'LOG' },
            { name: 'Customer Success', code: 'CS' }
        ]
    };

    for (const div of allDivs) {
        const depts = deptMap[div.code];
        if (depts) {
            for (const dept of depts) {
                await db.insert(orgUnits).values({ ...dept, parentId: div.id }).onConflictDoNothing();
            }
        }
    }

    const allOrgUnits = await db.select().from(orgUnits);

    // --- 6. Positions ---
    console.log('  - Seeding positions...');
    const posData = [
        { code: 'CEO', title: 'Chief Executive Officer' },
        { code: 'HR_MGR', title: 'HR Manager' },
        { code: 'CTO', title: 'Chief Technology Officer' },
        { code: 'CFO', title: 'Chief Financial Officer' },
        { code: 'ENG_MGR', title: 'Engineering Manager' },
        { code: 'SWE', title: 'Software Engineer' },
        { code: 'QA_ENG', title: 'QA Engineer' },
        { code: 'HR_GEN', title: 'HR Generalist' },
        { code: 'ACC', title: 'Accountant' },
    ];
    for (const pos of posData) {
        await db.insert(positions).values({ ...pos, isActive: true }).onConflictDoNothing();
    }
    const allPositions = await db.select().from(positions);

    // --- 7. Employees & Users ---
    console.log('  - Generating employees...');
    
    // Fixed Demo Users
    const demoUsers = [
        { email: 'ceo@hybrid-hris.local', role: 'MANAGER', pos: 'CEO', org: 'HQ', fname: 'Arthur', lname: 'Chief' },
        { email: 'hr@hybrid-hris.local', role: 'HR_ADMIN', pos: 'HR_MGR', org: 'HR', fname: 'Sarah', lname: 'Human' },
        { email: 'admin@hybrid-hris.local', role: 'ADMIN', pos: 'SYSTEM_ADMIN', org: 'HQ', fname: 'System', lname: 'Root' },
    ];

    const employeeList: any[] = [];

    async function createEmployee(data: {
        email: string, roleCode: string, posCode: string, orgCode: string, fname: string, lname: string, empNo: string
    }) {
        const org = (await db.select().from(orgUnits).where(eq(orgUnits.code, data.orgCode)).limit(1))[0];
        let pos = allPositions.find(p => p.code === data.posCode);
        if (!pos) {
            [pos] = await db.insert(positions).values({ code: data.posCode, title: data.posCode.replace('_', ' '), isActive: true }).onConflictDoNothing().returning();
        }

        const [emp] = await db.insert(employees).values({
            employeeNo: data.empNo,
            firstName: data.fname,
            lastName: data.lname,
            orgUnitId: org?.id,
            positionId: pos?.id,
            hireDate: '2022-01-01',
            status: 'ACTIVE',
            employmentType: 'REGULAR',
        }).onConflictDoNothing().returning();

        const resolvedEmp = emp || (await db.select().from(employees).where(eq(employees.employeeNo, data.empNo)))[0];

        // Profile & IDs
        await db.insert(employeeProfiles).values({
            employeeId: resolvedEmp.id,
            mobileNo: faker.phone.number(),
            birthDate: '1985-05-20',
            gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
            civilStatus: 'MARRIED'
        }).onConflictDoNothing();

        await db.insert(employeeIdentifiers).values({
            employeeId: resolvedEmp.id,
            tinNo: faker.string.numeric(12),
            sssNo: faker.string.numeric(10),
            philHealthNo: faker.string.numeric(12),
            pagIbigNo: faker.string.numeric(12)
        }).onConflictDoNothing();

        // User Account
        const [usr] = await db.insert(users).values({
            employeeId: resolvedEmp.id,
            email: data.email,
            passwordHash,
            attendancePinHash: pinHash,
            isActive: true
        }).onConflictDoNothing().returning();
        const resolvedUsr = usr || (await db.select().from(users).where(eq(users.email, data.email)))[0];

        // Role
        const role = (await db.select().from(roles).where(eq(roles.code, data.roleCode)))[0];
        if (resolvedUsr && role) {
            await db.insert(userRoles).values({ userId: resolvedUsr.id, roleId: role.id }).onConflictDoNothing();
        }

        // Leader?
        if (data.roleCode === 'MANAGER' || data.roleCode === 'HR_ADMIN') {
            await db.insert(orgUnitLeaders).values({
                orgUnitId: org.id, employeeId: resolvedEmp.id, role: 'HEAD', effectiveFrom: '2022-01-01'
            }).onConflictDoNothing();
        }

        // Shift
        await db.insert(employeeShiftAssignments).values({
            employeeId: resolvedEmp.id, shiftTemplateId: resolvedDayShift.id,
            startTime: '09:00', endTime: '18:00', breakMinutes: 60,
            isFlexible: false,
            isMon: true, isTue: true, isWed: true, isThu: true, isFri: true,
            isSat: false, isSun: false,
            effectiveFrom: '2022-01-01'
        }).onConflictDoNothing();

        // Leave Policy
        await db.insert(employeeLeavePolicies).values({
            employeeId: resolvedEmp.id, policyId, effectiveFrom: '2022-01-01'
        }).onConflictDoNothing();

        return { emp: resolvedEmp, usr: resolvedUsr };
    }

    // 1. Create Demo Users
    console.log('  - Seeding demo accounts...');
    for (let i = 0; i < demoUsers.length; i++) {
        const d = demoUsers[i];
        const { emp, usr } = await createEmployee({
            email: d.email, roleCode: d.role, posCode: d.pos, orgCode: d.org, fname: d.fname, lname: d.lname, empNo: `EMP-00000${i}`
        });
        
        if (d.email === 'admin@hybrid-hris.local') adminUserObj = usr;
        if (d.email === 'hr@hybrid-hris.local') hrUserObj = usr;
        
        employeeList.push(emp);
    }

    // 2. Generate Randomized Bulk Employees (~80 more)
    console.log('  - Seeding bulk enterprise data...');
    for (let i = 10; i < 90; i++) {
        const org = faker.helpers.arrayElement(allOrgUnits);
        const pos = faker.helpers.arrayElement(allPositions);
        const fname = faker.person.firstName();
        const lname = faker.person.lastName();
        const empNo = `EMP-${1000 + i}`;
        
        const { emp } = await createEmployee({
            email: faker.internet.email({ firstName: fname, lastName: lname }).toLowerCase(),
            roleCode: SystemRole.EMPLOYEE,
            posCode: pos.code,
            orgCode: org.code,
            fname,
            lname,
            empNo
        });
        employeeList.push(emp);
    }

    // --- 8. Plantilla limits ---
    console.log('  - Setting plantilla limits...');
    for (const org of allOrgUnits) {
        for (const pos of allPositions) {
            // Randomly assign some positions to units with limits
            if (faker.datatype.boolean(0.3)) {
                await db.insert(orgUnitPositions).values({
                    orgUnitId: org.id,
                    positionId: pos.id,
                    headcountLimit: faker.number.int({ min: 2, max: 15 }),
                    isActive: true
                }).onConflictDoNothing();
            }
        }
    }

    // --- 9. Attendance (Last 30 Days) ---
    console.log('  - Seeding 30 days of attendance logs...');
    const attendanceData: any[] = [];
    for (const emp of employeeList) {
        for (let d = 1; d <= 30; d++) {
            const date = new Date(today);
            date.setDate(today.getDate() - d);
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            const dateStr = date.toISOString().slice(0, 10);
            const punchIn = new Date(`${dateStr}T08:45:00Z`);
            punchIn.setMinutes(faker.number.int({ min: 45, max: 70 })); 
            
            const punchOut = new Date(`${dateStr}T18:00:00Z`);
            punchOut.setMinutes(faker.number.int({ min: 0, max: 20 })); 

            attendanceData.push({
                employeeId: emp.id,
                workDate: dateStr,
                actualInAt: punchIn,
                actualOutAt: punchOut,
                sourceIn: 'WEB',
                sourceOut: 'WEB'
            });
        }
    }
    if (attendanceData.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < attendanceData.length; i += chunkSize) {
            await db.insert(attendanceLogs).values(attendanceData.slice(i, i + chunkSize)).onConflictDoNothing();
        }
    }

    // --- 10. Leave Accruals (Last 6 Months) ---
    console.log('  - Seeding 6 months of leave accruals...');
    const accrualMonths = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        accrualMonths.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            label: d.toISOString().slice(0, 7)
        });
    }

    for (const m of accrualMonths) {
        for (const emp of employeeList) {
            if (vlType) {
                await db.insert(leaveLedger).values({
                    employeeId: emp.id,
                    leaveTypeId: vlType.id,
                    entryType: 'ACCRUAL',
                    amount: '1.2500',
                    balance: '0.0000',
                    accrualKey: `SEED-ACCRUAL-${m.label}-${emp.id}-${vlType.code}`
                }).onConflictDoNothing();
            }
            if (slType) {
                await db.insert(leaveLedger).values({
                    employeeId: emp.id,
                    leaveTypeId: slType.id,
                    entryType: 'ACCRUAL',
                    amount: '1.2500',
                    balance: '0.0000',
                    accrualKey: `SEED-ACCRUAL-${m.label}-${emp.id}-${slType.code}`
                }).onConflictDoNothing();
            }
        }
    }

    // --- 11. Leave Requests ---
    console.log('  - Seeding randomized leave requests...');
    const leaveStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    const leaveEmployees = faker.helpers.arrayElements(employeeList, Math.floor(employeeList.length * 0.3));
    
    for (const emp of leaveEmployees) {
        const requestCount = faker.number.int({ min: 1, max: 2 });
        for (let i = 0; i < requestCount; i++) {
            const status = faker.helpers.arrayElement(leaveStatuses);
            const leaveType = faker.helpers.arrayElement([vlType, slType]);
            if (!leaveType) continue;

            const startDate = faker.date.between({ 
                from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), 
                to: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) 
            });
            const days = faker.number.int({ min: 1, max: 3 });
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + (days - 1));

            const [req] = await db.insert(leaveRequests).values({
                employeeId: emp.id,
                leaveTypeId: leaveType.id,
                startDate: startDate.toISOString().slice(0, 10),
                endDate: endDate.toISOString().slice(0, 10),
                days: days.toFixed(4),
                status: status as any,
                notes: faker.lorem.sentence(),
            }).returning();

            if (req) {
                const approverId = adminUserObj?.id || hrUserObj?.id;
                if (approverId) {
                    await db.insert(leaveRequestApprovals).values({
                        leaveRequestId: req.id,
                        approverUserId: approverId,
                        level: 1,
                        status: status === 'PENDING' ? 'PENDING' : (status === 'APPROVED' ? 'APPROVED' : 'REJECTED'),
                        actedAt: status !== 'PENDING' ? new Date() : null,
                        remarks: status !== 'PENDING' ? 'Processed via enterprise seed' : null,
                    }).onConflictDoNothing();
                }
                if (status === 'APPROVED') {
                    await db.insert(leaveLedger).values({
                        employeeId: emp.id,
                        leaveTypeId: leaveType.id,
                        entryType: 'CONSUMPTION',
                        amount: `-${days}.0000`,
                        balance: '0.0000',
                        referenceLeaveRequestId: req.id,
                    });
                }
            }
        }
    }

    // --- 12. Manpower Requests (Plantilla) ---
    console.log('  - Seeding manpower requests...');
    const requestTypes = ['NEW_HEADCOUNT', 'REPLACEMENT', 'PROJECT_BASED'];
    const mrStatuses = ['DRAFT', 'SUBMITTED', 'SUBMITTED_TO_ROOT', 'APPROVED', 'REJECTED'];
    const allUsers = await db.select().from(users);

    const sampleSummaries = [
        '<p>We are seeking a <strong>talented professional</strong> to join our growing team. This role is critical for our upcoming expansion and requires someone with a passion for excellence and innovation.</p>',
        '<p>Join our dynamic department as we scale our operations. We need a <em>self-starter</em> who can hit the ground running and contribute to our strategic goals from day one.</p>',
        '<p>A unique opportunity for an experienced individual to take ownership of key projects and drive measurable impact within the organization.</p>'
    ];

    const sampleResponsibilities = [
        '<ul><li>Drive end-to-end execution of department initiatives and key performance indicators.</li><li>Collaborate with cross-functional stakeholders to ensure alignment and delivery of project goals.</li><li>Mentor junior team members and foster a culture of continuous learning and improvement.</li><li>Analyze complex data sets to provide actionable insights for senior leadership.</li></ul>',
        '<ul><li>Manage daily operations and ensure all workflows are optimized for maximum efficiency.</li><li>Prepare comprehensive reports and presentations for monthly business reviews.</li><li>Identify and mitigate operational risks through proactive monitoring and process improvements.</li><li>Champion the adoption of new technologies and methodologies across the team.</li></ul>'
    ];

    const sampleQualifications = [
        '<ul><li>Bachelor\'s degree in a relevant field; Master\'s or professional certification preferred.</li><li>Minimum of 3-5 years of proven experience in a similar capacity or industry.</li><li>Proficiency in modern office productivity suites and specialized industry software.</li><li>Strong analytical, communication, and interpersonal skills.</li></ul>',
        '<ul><li>Demonstrated track record of delivering high-quality results in a fast-paced environment.</li><li>Ability to work independently and as part of a collaborative team.</li><li>Fluent in English, both written and verbal; additional languages are a plus.</li><li>Deep understanding of industry best practices and regulatory requirements.</li></ul>'
    ];

    for (let i = 0; i < 12; i++) {
        const type = faker.helpers.arrayElement(requestTypes);
        const status = faker.helpers.arrayElement(mrStatuses);
        const org = faker.helpers.arrayElement(allOrgUnits);
        const pos = faker.helpers.arrayElement(allPositions);
        const quantity = faker.number.int({ min: 1, max: 3 });
        const requester = faker.helpers.arrayElement(allUsers);
        
        const [mr] = await db.insert(manpowerRequests).values({
            orgUnitId: org.id,
            positionId: pos.id,
            requestedBy: requester.id,
            requestType: type as any,
            quantity,
            employmentType: 'REGULAR',
            priority: faker.helpers.arrayElement(['NORMAL', 'HIGH', 'URGENT']),
            jobTitle: pos.title,
            jobSummary: faker.helpers.arrayElement(sampleSummaries),
            jobDescription: faker.lorem.paragraphs(2),
            responsibilities: faker.helpers.arrayElement(sampleResponsibilities),
            qualifications: faker.helpers.arrayElement(sampleQualifications),
            status: status as any,
            targetHireDate: todayIso,
        }).returning();

        if (mr && status !== 'DRAFT') {
            if (hrUserObj) {
                await db.insert(manpowerRequestApprovals).values({
                    manpowerRequestId: mr.id,
                    approverUserId: hrUserObj.id,
                    level: 1,
                    status: (status === 'SUBMITTED') ? 'PENDING' : 'APPROVED',
                    actedAt: (status === 'SUBMITTED') ? null : new Date(),
                });
            }
            if (status === 'SUBMITTED_TO_ROOT' || status === 'APPROVED' || status === 'REJECTED') {
                if (adminUserObj) {
                    await db.insert(manpowerRequestApprovals).values({
                        manpowerRequestId: mr.id,
                        approverUserId: adminUserObj.id,
                        level: 2,
                        status: (status === 'SUBMITTED_TO_ROOT') ? 'PENDING' : (status === 'APPROVED' ? 'APPROVED' : 'REJECTED'),
                        actedAt: (status === 'SUBMITTED_TO_ROOT') ? null : new Date(),
                    });
                }
            }
            if (status === 'APPROVED') {
                await db.insert(jobPostings).values({
                    manpowerRequestId: mr.id,
                    title: mr.jobTitle,
                    slug: `${mr.jobTitle.toLowerCase().replace(/ /g, '-')}-${mr.id.slice(0, 8)}`,
                    employmentType: 'REGULAR',
                    description: mr.jobSummary || '',
                    responsibilities: mr.responsibilities || '',
                    qualifications: mr.qualifications || '',
                    status: 'OPEN',
                });
            }
        }
    }

    // --- 13. Budgets ---
    console.log('  - Seeding department budgets...');
    await seedExpenses(db);

    // --- 14. Skills & Training ---
    console.log('  - Seeding Skills & Training module...');
    await seedSkillsEssential(db);
    
    if (process.env.LOAD_TEST_DATA === 'true') {
        await seedSkillsDemo(db);
    }

    console.log('✅ Enterprise Seed Complete!');
}

async function seedExpenses(db: any) {
    const categories = [
        { code: 'TRAVEL', name: 'Travel' },
        { code: 'MEALS', name: 'Meals & Entertainment' },
        { code: 'HARDWARE', name: 'Hardware & Equipment' },
        { code: 'SOFTWARE', name: 'Software' },
    ];
    for (const cat of categories) {
        await db.insert(expenseCategories).values(cat).onConflictDoNothing();
    }
    const cats = await db.select().from(expenseCategories);

    const now = new Date();
    const [period] = await db.insert(budgetPeriods).values({
        code: `${now.getFullYear()}-03`,
        name: 'March 2026',
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31',
        periodType: 'MONTHLY' as BudgetPeriodType
    }).onConflictDoNothing().returning();
    
    const resolvedPeriod = period || (await db.select().from(budgetPeriods).limit(1))[0];
    const allOrgs = await db.select().from(orgUnits);
    const leafOrgs = allOrgs.filter((ou: { id: any; }) => !allOrgs.some((child: { parentId: any; }) => child.parentId === ou.id));

    for (const org of leafOrgs) {
        for (const cat of cats) {
            const amount = faker.number.int({ min: 1000, max: 10000 }).toString() + '.00';
            await db.insert(orgUnitBudgets).values({
                orgUnitId: org.id, budgetPeriodId: resolvedPeriod.id, expenseCategoryId: cat.id, amountAllocated: amount
            }).onConflictDoNothing();
            
            await db.insert(budgetLedger).values({
                orgUnitId: org.id, budgetPeriodId: resolvedPeriod.id, expenseCategoryId: cat.id, 
                entryType: 'ALLOCATION' as BudgetLedgerEntryType, amount
            }).onConflictDoNothing();
        }
    }
}

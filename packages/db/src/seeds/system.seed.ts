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
import { jobLevels } from '../schema/job-levels';
import { compensationTemplates } from '../schema/compensation-templates';
import { compensationTemplateComponents } from '../schema/compensation-template-components';
import { employeeCompensations } from '../schema/employee-compensations';
import { faker } from '@faker-js/faker';
import { seedSkillsEssential } from './skills-seed-essential';
import { seedSkillsDemo } from './skills-seed-demo';
import { seedHolidays } from './holidays.seed';
import { seedOvertimeRequests } from './overtime-requests.seed';
import { seedStatutoryBrackets } from './statutory-brackets.seed';
import { seedPremiumPayRates } from './premium-pay-rates.seed';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function seedSystem() {
    console.log('🚀 Starting Enterprise Seed (Hierarchical Mode)...');
    
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

    const [probPolicy] = await db.insert(leavePolicies).values({
        code: 'PROB_POLICY', name: 'Probationary Policy', isDefault: false, isActive: true, effectiveFrom: '2020-01-01'
    }).onConflictDoNothing().returning();

    const [contractPolicy] = await db.insert(leavePolicies).values({
        code: 'CONTRACT_POLICY', name: 'Contractual / Consultant Policy', isDefault: false, isActive: true, effectiveFrom: '2020-01-01'
    }).onConflictDoNothing().returning();

    const policyId = stdPolicy?.id || (await db.select().from(leavePolicies).where(eq(leavePolicies.code, 'STD_POLICY')))[0].id;
    const probPolicyId = probPolicy?.id || (await db.select().from(leavePolicies).where(eq(leavePolicies.code, 'PROB_POLICY')))[0].id;
    const contractPolicyId = contractPolicy?.id || (await db.select().from(leavePolicies).where(eq(leavePolicies.code, 'CONTRACT_POLICY')))[0].id;

    if (vlType && slType) {
        // Standard Rules
        await db.insert(leavePolicyRules).values([
            { policyId, leaveTypeId: vlType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '1.25', maxBalance: '30' },
            { policyId, leaveTypeId: slType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '1.25', maxBalance: '15' },
        ]).onConflictDoNothing();

        // Probationary Rules (Example: lower accrual or lower max balance)
        await db.insert(leavePolicyRules).values([
            { policyId: probPolicyId, leaveTypeId: vlType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '0.833', maxBalance: '5' },
            { policyId: probPolicyId, leaveTypeId: slType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '0.833', maxBalance: '5' },
        ]).onConflictDoNothing();

        // Contractual (Example: No accruals, usually just SL/VL but maybe unpaid or fixed - for now let's just seed a record with 0 accrual)
        await db.insert(leavePolicyRules).values([
            { policyId: contractPolicyId, leaveTypeId: vlType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '0', maxBalance: '0' },
            { policyId: contractPolicyId, leaveTypeId: slType.id, accrualMethod: 'MONTHLY', accrualRatePerMonth: '0', maxBalance: '0' },
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
        timezone: 'Asia/Manila',
        passwordLoginEnabled: true,
        googleLoginEnabled: true,
        microsoftLoginEnabled: true
    }).onConflictDoUpdate({
        target: hrSettings.singleton,
        set: { 
            googleLoginEnabled: true, 
            microsoftLoginEnabled: true,
            timezone: 'Asia/Manila',
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
    const leafOrgs = allOrgUnits.filter(ou => !allOrgUnits.some(child => child.parentId === ou.id));

    // --- 6. Positions & Job Levels ---
    console.log('  - Seeding positions & job levels...');
    const posData = [
        { code: 'CEO', title: 'Chief Executive Officer' },
        { code: 'DIV_HEAD', title: 'Division Director' },
        { code: 'DEPT_MGR', title: 'Department Manager' },
        { code: 'HR_MGR', title: 'HR Manager' },
        { code: 'CTO', title: 'Chief Technology Officer' },
        { code: 'CFO', title: 'Chief Financial Officer' },
        { code: 'ENG_MGR', title: 'Engineering Manager' },
        { code: 'SWE', title: 'Software Engineer' },
        { code: 'QA_ENG', title: 'QA Engineer' },
        { code: 'HR_GEN', title: 'HR Generalist' },
        { code: 'ACC', title: 'Accountant' },
        { code: 'SYS_ADMIN', title: 'System Administrator' },
    ];
    for (const pos of posData) {
        await db.insert(positions).values({ ...pos, isActive: true }).onConflictDoNothing();
    }
    const allPositions = await db.select().from(positions);
    const allLevels = await db.select().from(jobLevels);
    const allCompTemplates = await db.select().from(compensationTemplates);
    const allCompTemplateComps = await db.select().from(compensationTemplateComponents);

    // --- 7. Employees & Users (Hierarchical) ---
    console.log('  - Generating employees with proper reporting lines...');
    
    const employeeList: any[] = [];
    const unitManagers = new Map<string, string>(); // orgUnitId -> employeeId

    async function createEmployee(data: {
        email: string, roleCode: string, posCode: string, levelCode: string, orgId: string, fname: string, lname: string, empNo: string, supervisorId?: string
    }) {
        const pos = allPositions.find(p => p.code === data.posCode) || allPositions[0];
        const level = allLevels.find(l => l.code === data.levelCode) || allLevels[0];

        const [emp] = await db.insert(employees).values({
            employeeNo: data.empNo,
            firstName: data.fname,
            lastName: data.lname,
            orgUnitId: data.orgId,
            positionId: pos.id,
            jobLevelId: level.id,
            supervisorId: data.supervisorId || null,
            hireDate: '2022-01-01',
            status: 'ACTIVE',
            employmentType: 'REGULAR',
            timezone: 'Asia/Manila',
        }).onConflictDoNothing().returning();

        const resolvedEmp = emp || (await db.select().from(employees).where(eq(employees.employeeNo, data.empNo)))[0];

        // Profile
        await db.insert(employeeProfiles).values({
            employeeId: resolvedEmp.id,
            mobileNo: '(+63) 917-123-4567',
            birthDate: '1985-05-20',
            gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
            civilStatus: 'MARRIED',
            emergencyContactMobileNo: faker.phone.number(),
            payrollType: 'MONTHLY',
            factorRate: '261.00',
        }).onConflictDoNothing();

        // IDs
        await db.insert(employeeIdentifiers).values({
            employeeId: resolvedEmp.id,
            tinNo: faker.string.numeric(12),
            sssNo: faker.string.numeric(10),
            philHealthNo: faker.string.numeric(12),
            pagIbigNo: faker.string.numeric(12)
        }).onConflictDoNothing();

        // User
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

        // Leader registration
        if (data.roleCode === 'MANAGER' || data.roleCode === 'HR_ADMIN' || data.roleCode === 'ADMIN') {
            await db.insert(orgUnitLeaders).values({
                orgUnitId: data.orgId, employeeId: resolvedEmp.id, role: 'HEAD', effectiveFrom: '2022-01-01'
            }).onConflictDoNothing();
        }

        // Shift & Policy
        await db.insert(employeeShiftAssignments).values({
            employeeId: resolvedEmp.id, shiftTemplateId: resolvedDayShift.id,
            startTime: '09:00', endTime: '18:00', breakMinutes: 60,
            isFlexible: false,
            isMon: true, isTue: true, isWed: true, isThu: true, isFri: true,
            isSat: false, isSun: false,
            effectiveFrom: '2022-01-01'
        }).onConflictDoNothing();

        await db.insert(employeeLeavePolicies).values({
            employeeId: resolvedEmp.id, policyId, effectiveFrom: '2022-01-01'
        }).onConflictDoNothing();

        // Check for compensation template
        if (level && level.id) {
            const template = allCompTemplates.find(t => t.jobLevelId === level.id);
            if (template) {
                const components = allCompTemplateComps.filter(c => c.templateId === template.id);
                if (components.length > 0) {
                    const toInsert = components.map(c => ({
                        employeeId: resolvedEmp.id,
                        payrollComponentId: c.payrollComponentId,
                        amount: c.amount,
                        effectiveFrom: '2022-01-01',
                    }));
                    await db.insert(employeeCompensations).values(toInsert).onConflictDoNothing();
                }
            }
        }

        return { emp: resolvedEmp, usr: resolvedUsr };
    }

    // A. Root Management
    console.log('    * Seeding Root Leaders...');
    const { emp: ceo, usr: ceoUser } = await createEmployee({
        email: 'ceo@hybrid-hris.local', roleCode: 'MANAGER', posCode: 'CEO', levelCode: 'L6', orgId: hqId, fname: 'Arthur', lname: 'Chief', empNo: 'EMP-000001'
    });
    unitManagers.set(hqId, ceo.id);

    const { emp: sysAdmin, usr: adminUser } = await createEmployee({
        email: 'admin@hybrid-hris.local', roleCode: 'ADMIN', posCode: 'SYS_ADMIN', levelCode: 'L4', orgId: hqId, fname: 'System', lname: 'Root', empNo: 'EMP-000002', supervisorId: ceo.id
    });
    adminUserObj = adminUser;
    employeeList.push(ceo, sysAdmin);

    // B. Division Heads
    console.log('    * Seeding Division Heads...');
    for (const div of allDivs) {
        const { emp: divHead } = await createEmployee({
            email: `${div.code.toLowerCase()}@hybrid-hris.local`, 
            roleCode: 'MANAGER', 
            posCode: 'DIV_HEAD', 
            levelCode: 'L5',
            orgId: div.id, 
            fname: faker.person.firstName(), 
            lname: faker.person.lastName(), 
            empNo: `EMP-DIV-${div.code}`,
            supervisorId: ceo.id
        });
        unitManagers.set(div.id, divHead.id);
        employeeList.push(divHead);
    }

    // C. Department Managers (Leafs)
    console.log('    * Seeding Department Managers...');
    for (const leaf of leafOrgs) {
        if (leaf.id === hqId) continue;
        
        const parentDivManagerId = unitManagers.get(leaf.parentId!);
        const isHR = leaf.code === 'HR';
        
        const { emp: deptMgr, usr: deptUser } = await createEmployee({
            email: isHR ? 'hr@hybrid-hris.local' : `${leaf.code.toLowerCase()}-mgr@hybrid-hris.local`, 
            roleCode: isHR ? 'HR_ADMIN' : 'MANAGER', 
            posCode: isHR ? 'HR_MGR' : 'DEPT_MGR', 
            levelCode: 'L4',
            orgId: leaf.id, 
            fname: faker.person.firstName(), 
            lname: faker.person.lastName(), 
            empNo: `EMP-MGR-${leaf.code}`,
            supervisorId: parentDivManagerId || ceo.id
        });
        
        if (isHR) hrUserObj = deptUser;
        unitManagers.set(leaf.id, deptMgr.id);
        employeeList.push(deptMgr);
    }

    // D. Bulk Staff (Leaf Only)
    console.log('    * Seeding staff distributed in leaf nodes...');
    for (let i = 0; i < 80; i++) {
        const leaf = faker.helpers.arrayElement(leafOrgs);
        if (leaf.id === hqId) continue;

        const deptMgrId = unitManagers.get(leaf.id);
        const fname = faker.person.firstName();
        const lname = faker.person.lastName();
        
        const { emp } = await createEmployee({
            email: faker.internet.email({ firstName: fname, lastName: lname }).toLowerCase(),
            roleCode: SystemRole.EMPLOYEE,
            posCode: leaf.code === 'HR' ? 'HR_GEN' : (leaf.code === 'FIN' ? 'ACC' : (leaf.code === 'QA' ? 'QA_ENG' : 'SWE')),
            levelCode: faker.helpers.arrayElement(['L1', 'L2']),
            orgId: leaf.id,
            fname,
            lname,
            empNo: `EMP-STAFF-${1000 + i}`,
            supervisorId: deptMgrId
        });
        employeeList.push(emp);
    }

    // --- 8. Plantilla limits ---
    console.log('  - Setting plantilla limits...');
    for (const org of allOrgUnits) {
        for (const pos of allPositions) {
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

    // --- 9. Attendance (Last 180 Days) ---
    console.log('  - Seeding 180 days of attendance logs...');
    const attendanceData: any[] = [];
    for (const emp of employeeList) {
        for (let d = 1; d <= 180; d++) {
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

    // --- 12. Manpower Requests ---
    console.log('  - Seeding manpower requests...');
    const requestTypes = ['NEW_HEADCOUNT', 'REPLACEMENT', 'PROJECT_BASED'];
    const mrStatuses = ['DRAFT', 'SUBMITTED', 'SUBMITTED_TO_ROOT', 'APPROVED', 'REJECTED'];
    const allUsers = await db.select().from(users);

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
            jobSummary: '<p>Standard summary generated via seed.</p>',
            jobDescription: faker.lorem.paragraphs(2),
            responsibilities: '<ul><li>Standard responsibility</li></ul>',
            qualifications: '<ul><li>Standard qualification</li></ul>',
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

    // --- 15. Holidays ---
    await seedHolidays(db);

    // --- 16. Overtime Requests ---
    await seedOvertimeRequests(db);

    // --- 17. Statutory Brackets ---
    await seedStatutoryBrackets(db);
    await seedPremiumPayRates(db);

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

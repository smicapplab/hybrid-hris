import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { roles } from '../schema/roles';
import { leaveTypes } from '../schema/leave-types';
import { employees } from '../schema/employees';
import { users } from '../schema/users';
import { userRoles } from '../schema/user-roles';
import { eq } from 'drizzle-orm';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function seedSystem() {
    console.log('Seeding system data...');

    // ---- Roles ----
    await db.insert(roles).values([
        { code: 'ADMIN', name: 'Administrator', isSystem: true },
        { code: 'HR', name: 'HR Officer', isSystem: true },
        { code: 'MANAGER', name: 'Manager', isSystem: true },
        { code: 'EMPLOYEE', name: 'Employee', isSystem: true },
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

    // ---- Initial Admin Employee ----
    const [adminEmployee] = await db.insert(employees)
        .values({
            employeeNo: 'EMP-0001',
            firstName: 'System',
            lastName: 'Administrator',
            hireDate: new Date().toISOString().slice(0, 10),
            employmentType: 'REGULAR',
            status: 'ACTIVE',
        })
        .onConflictDoNothing()
        .returning();

    // Fetch ADMIN role
    const [adminRole] = await db.select()
        .from(roles)
        .where(eq(roles.code, 'ADMIN'));

    // ---- Initial Admin User ----
    let adminUserId: string | undefined;

    const insertedUsers = await db.insert(users)
        .values({
            employeeId: adminEmployee?.id,
            email: 'admin@hybrid-hris.local',
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

    console.log('System seed completed.');
}
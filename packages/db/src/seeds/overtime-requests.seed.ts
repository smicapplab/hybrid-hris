import { overtimeRequests } from '../schema/overtime-requests';
import { employees } from '../schema/employees';
import { users } from '../schema/users';
import { eq, inArray, isNull, and } from 'drizzle-orm';
import { faker } from '@faker-js/faker';

export async function seedOvertimeRequests(db: any) {
    console.log('  - Seeding overtime requests...');

    // 1. Find the target managers/admins
    const targetEmails = ['fin-mgr@hybrid-hris.local', 'admin@hybrid-hris.local'];
    const targetUsers = await db.select({
        employeeId: users.employeeId,
        email: users.email
    })
    .from(users)
    .where(inArray(users.email, targetEmails));

    for (const target of targetUsers) {
        if (!target.employeeId) continue;

        // 2. Find employees reporting to them
        const subordinates = await db.select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName
        })
        .from(employees)
        .where(and(
            eq(employees.supervisorId, target.employeeId),
            isNull(employees.deletedAt)
        ));

        if (subordinates.length === 0) {
            console.log(`    ! No subordinates found for ${target.email}`);
            continue;
        }

        console.log(`    * Adding OT requests for ${subordinates.length} employees under ${target.email}`);

        for (const sub of subordinates) {
            // Add 1-2 pending OT requests for each subordinate
            const count = faker.number.int({ min: 1, max: 2 });
            for (let i = 0; i < count; i++) {
                const date = faker.date.recent({ days: 7 });
                await db.insert(overtimeRequests).values({
                    employeeId: sub.id,
                    date: date,
                    hours: faker.number.int({ min: 2, max: 4 }).toString(),
                    type: faker.helpers.arrayElement(['REGULAR_OT', 'REST_DAY_OT', 'HOLIDAY_OT']) as any,
                    status: 'PENDING',
                    reason: faker.lorem.sentence(),
                });
            }
        }
    }
}

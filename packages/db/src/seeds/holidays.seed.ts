import { holidays } from '../schema/holidays';

export async function seedHolidays(db: any) {
    console.log('  - Seeding Philippine Holidays (2026)...');

    const phHolidays = [
        // Regular Holidays
        { name: "New Year's Day", date: '2026-01-01', type: 'REGULAR', countryCode: 'PH', isRecurring: true },
        { name: "Maundy Thursday", date: '2026-04-02', type: 'REGULAR', countryCode: 'PH', isRecurring: false },
        { name: "Good Friday", date: '2026-04-03', type: 'REGULAR', countryCode: 'PH', isRecurring: false },
        { name: "Araw ng Kagitingan", date: '2026-04-09', type: 'REGULAR', countryCode: 'PH', isRecurring: true },
        { name: "Labor Day", date: '2026-05-01', type: 'REGULAR', countryCode: 'PH', isRecurring: true },
        { name: "Independence Day", date: '2026-06-12', type: 'REGULAR', countryCode: 'PH', isRecurring: true },
        { name: "National Heroes Day", date: '2026-08-31', type: 'REGULAR', countryCode: 'PH', isRecurring: false },
        { name: "Bonifacio Day", date: '2026-11-30', type: 'REGULAR', countryCode: 'PH', isRecurring: true },
        { name: "Christmas Day", date: '2026-12-25', type: 'REGULAR', countryCode: 'PH', isRecurring: true },
        { name: "Rizal Day", date: '2026-12-30', type: 'REGULAR', countryCode: 'PH', isRecurring: true },

        // Special Non-Working Days
        { name: "Chinese New Year", date: '2026-02-17', type: 'SPECIAL', countryCode: 'PH', isRecurring: false },
        { name: "Black Saturday", date: '2026-04-04', type: 'SPECIAL', countryCode: 'PH', isRecurring: false },
        { name: "Ninoy Aquino Day", date: '2026-08-21', type: 'SPECIAL', countryCode: 'PH', isRecurring: true },
        { name: "All Saints' Day", date: '2026-11-01', type: 'SPECIAL', countryCode: 'PH', isRecurring: true },
        { name: "Feast of the Immaculate Conception", date: '2026-12-08', type: 'SPECIAL', countryCode: 'PH', isRecurring: true },
        { name: "Last Day of the Year", date: '2026-12-31', type: 'SPECIAL', countryCode: 'PH', isRecurring: true },
    ];

    for (const holiday of phHolidays) {
        await db.insert(holidays).values(holiday).onConflictDoNothing();
    }
}

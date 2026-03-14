import { holidays } from '../schema/holidays';

export async function seedHolidays(db: any) {
    console.log('  - Seeding Philippine Holidays (2026)...');

    const phHolidays = [
        // Regular Holidays
        { name: "New Year's Day", date: '2026-01-01', type: 'REGULAR', countryCode: 'PH' },
        { name: "Maundy Thursday", date: '2026-04-02', type: 'REGULAR', countryCode: 'PH' },
        { name: "Good Friday", date: '2026-04-03', type: 'REGULAR', countryCode: 'PH' },
        { name: "Araw ng Kagitingan", date: '2026-04-09', type: 'REGULAR', countryCode: 'PH' },
        { name: "Labor Day", date: '2026-05-01', type: 'REGULAR', countryCode: 'PH' },
        { name: "Independence Day", date: '2026-06-12', type: 'REGULAR', countryCode: 'PH' },
        { name: "National Heroes Day", date: '2026-08-31', type: 'REGULAR', countryCode: 'PH' },
        { name: "Bonifacio Day", date: '2026-11-30', type: 'REGULAR', countryCode: 'PH' },
        { name: "Christmas Day", date: '2026-12-25', type: 'REGULAR', countryCode: 'PH' },
        { name: "Rizal Day", date: '2026-12-30', type: 'REGULAR', countryCode: 'PH' },

        // Special Non-Working Days
        { name: "Chinese New Year", date: '2026-02-17', type: 'SPECIAL', countryCode: 'PH' },
        { name: "Black Saturday", date: '2026-04-04', type: 'SPECIAL', countryCode: 'PH' },
        { name: "Ninoy Aquino Day", date: '2026-08-21', type: 'SPECIAL', countryCode: 'PH' },
        { name: "All Saints' Day", date: '2026-11-01', type: 'SPECIAL', countryCode: 'PH' },
        { name: "Feast of the Immaculate Conception", date: '2026-12-08', type: 'SPECIAL', countryCode: 'PH' },
        { name: "Last Day of the Year", date: '2026-12-31', type: 'SPECIAL', countryCode: 'PH' },
    ];

    for (const holiday of phHolidays) {
        await db.insert(holidays).values(holiday).onConflictDoNothing();
    }
}

import { premiumPayRates } from '../schema/premium-pay-rates';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export async function seedPremiumPayRates(db: NodePgDatabase<any>) {
    console.log('  - Seeding Premium Pay Rates (PH Standards)...');

    const rates = [
        // OVERTIME
        {
            code: 'ORD_OT',
            name: 'Ordinary Day Overtime',
            category: 'OVERTIME' as const,
            multiplier: '1.250',
            description: 'Work in excess of 8 hours on an ordinary working day (125%)',
        },

        // REST DAY
        {
            code: 'REST_DAY',
            name: 'Rest Day Pay',
            category: 'REST_DAY' as const,
            multiplier: '1.300',
            description: 'Work performed on a scheduled rest day (130%)',
        },
        {
            code: 'REST_DAY_OT',
            name: 'Rest Day Overtime',
            category: 'OVERTIME' as const,
            multiplier: '1.690', // 1.30 * 1.30
            description: 'Work in excess of 8 hours on a rest day (130% of 130%)',
        },

        // HOLIDAYS
        {
            code: 'SPE_HOL',
            name: 'Special Holiday Pay',
            category: 'HOLIDAY' as const,
            multiplier: '1.300',
            description: 'Work performed on a special non-working holiday (130%)',
        },
        {
            code: 'SPE_HOL_REST',
            name: 'Special Holiday on Rest Day',
            category: 'HOLIDAY' as const,
            multiplier: '1.500',
            description: 'Work on a special holiday that falls on a rest day (150%)',
        },
        {
            code: 'REG_HOL',
            name: 'Regular Holiday Pay',
            category: 'HOLIDAY' as const,
            multiplier: '2.000',
            description: 'Double pay for work on a regular holiday (200%)',
        },
        {
            code: 'REG_HOL_REST',
            name: 'Regular Holiday on Rest Day',
            category: 'HOLIDAY' as const,
            multiplier: '2.600',
            description: 'Work on a regular holiday that falls on a rest day (200% * 130%)',
        },
        {
            code: 'REG_HOL_OT',
            name: 'Regular Holiday Overtime',
            category: 'OVERTIME' as const,
            multiplier: '2.600',
            description: 'OT during a regular holiday (2.00 * 1.30)',
        },

        // NIGHT DIFF
        {
            code: 'ND',
            name: 'Night Differential',
            category: 'NIGHT_DIFF' as const,
            multiplier: '1.100',
            description: '10% premium for work between 10PM and 6AM',
        },
    ];

    for (const rate of rates) {
        await db.insert(premiumPayRates).values(rate).onConflictDoUpdate({
            target: premiumPayRates.code,
            set: {
                multiplier: rate.multiplier,
                name: rate.name,
                category: rate.category,
                description: rate.description,
            },
        });
    }
}

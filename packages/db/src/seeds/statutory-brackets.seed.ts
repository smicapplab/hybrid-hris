import { statutoryBrackets } from '../schema/statutory-brackets';
import { sql } from 'drizzle-orm';

export async function seedStatutoryBrackets(db: any) {
    console.log('  - Seeding Statutory Contribution Brackets (PH 2024)...');
    const brackets: any[] = [];
    const effectiveFrom = '2024-01-01'; // Example: when the latest TRAIN/SSS update took effect
    
    // --- 1. SSS (Sample brackets, simplified for brevity) ---
    // Full table has ~50 rows, we will seed a few key ones representing the 2024 14% rate
    brackets.push(
        { type: 'SSS', name: '2024 SSS Schedule', effectiveFrom, minCompensation: '0.00', maxCompensation: '4249.99', employeeShareAmount: '180.00', employerShareAmount: '390.00' },
        { type: 'SSS', name: '2024 SSS Schedule', effectiveFrom, minCompensation: '4250.00', maxCompensation: '14749.99', employeeShareAmount: '202.50', employerShareAmount: '437.50' },
        { type: 'SSS', name: '2024 SSS Schedule', effectiveFrom, minCompensation: '14750.00', maxCompensation: '24749.99', employeeShareAmount: '800.00', employerShareAmount: '1700.00' },
        { type: 'SSS', name: '2024 SSS Schedule', effectiveFrom, minCompensation: '24750.00', maxCompensation: '29749.99', employeeShareAmount: '1125.00', employerShareAmount: '2400.00' },
        { type: 'SSS', name: '2024 SSS Schedule', effectiveFrom, minCompensation: '29750.00', maxCompensation: null, employeeShareAmount: '1350.00', employerShareAmount: '2860.00' } // Max bracket
    );

    // --- 2. PhilHealth (PHIC) 2024 5% Rate ---
    // Floor is 10k, Ceiling is 100k
    brackets.push(
        { type: 'PHIC', name: '2024 PHIC 5%', effectiveFrom, minCompensation: '0.00', maxCompensation: '9999.99', employeeShareAmount: '250.00', employerShareAmount: '250.00' }, // Flat floor
        { type: 'PHIC', name: '2024 PHIC 5%', effectiveFrom, minCompensation: '10000.00', maxCompensation: '99999.99', employeeShareRate: '0.0250', employerShareRate: '0.0250' }, // 2.5% each
        { type: 'PHIC', name: '2024 PHIC 5%', effectiveFrom, minCompensation: '100000.00', maxCompensation: null, employeeShareAmount: '2500.00', employerShareAmount: '2500.00' } // Flat ceiling
    );

    // --- 3. Pag-IBIG (HDMF) 2024 ---
    // 2024 increase to 200/200 flat for most earners 
    brackets.push(
        { type: 'HDMF', name: '2024 HDMF Schedule', effectiveFrom, minCompensation: '0.00', maxCompensation: '1500.00', employeeShareRate: '0.0100', employerShareRate: '0.0200' },
        { type: 'HDMF', name: '2024 HDMF Schedule', effectiveFrom, minCompensation: '1500.01', maxCompensation: null, employeeShareAmount: '200.00', employerShareAmount: '200.00' } // Max 200
    );

    // --- 4. Withholding Tax (WTAX) - TRAIN Law Weekly/Semi/Monthly ---
    // Example: Semi-Monthly Tax Table (Revised 2023 onwards)
    brackets.push(
        { type: 'WTAX', name: 'TRAIN Law Semi-Monthly 2023+', effectiveFrom, minCompensation: '0.00', maxCompensation: '10416.99', baseTaxAmount: '0.00', excessTaxRate: '0.0000' }, // Tax free
        { type: 'WTAX', name: 'TRAIN Law Semi-Monthly 2023+', effectiveFrom, minCompensation: '10417.00', maxCompensation: '16666.66', baseTaxAmount: '0.00', excessTaxRate: '0.1500' }, // +15% over 10417
        { type: 'WTAX', name: 'TRAIN Law Semi-Monthly 2023+', effectiveFrom, minCompensation: '16666.67', maxCompensation: '33332.99', baseTaxAmount: '937.50', excessTaxRate: '0.2000' }, // +20% over 16667
        { type: 'WTAX', name: 'TRAIN Law Semi-Monthly 2023+', effectiveFrom, minCompensation: '33333.00', maxCompensation: '83332.99', baseTaxAmount: '4270.70', excessTaxRate: '0.2500' }, // +25% over 33333
        { type: 'WTAX', name: 'TRAIN Law Semi-Monthly 2023+', effectiveFrom, minCompensation: '83333.00', maxCompensation: '333332.99', baseTaxAmount: '16770.70', excessTaxRate: '0.3000' }, // +30% over 83333
        { type: 'WTAX', name: 'TRAIN Law Semi-Monthly 2023+', effectiveFrom, minCompensation: '333333.00', maxCompensation: null, baseTaxAmount: '91770.70', excessTaxRate: '0.3500' } // +35% over 333333
    );

    await db.insert(statutoryBrackets).values(brackets).onConflictDoNothing();
}

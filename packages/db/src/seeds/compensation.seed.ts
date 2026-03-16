import { sql } from "drizzle-orm";
import { jobLevels } from "../schema/job-levels";
import { payrollComponents } from "../schema/payroll-components";

export async function seedCompensation(db: any) {
    console.log('  - Seeding compensation foundations...');
    
    // --- 1. Job Levels (Ranks) ---
    const levels = [
        { code: 'L1', name: 'Junior Staff / Associate', rankOrder: 1 },
        { code: 'L2', name: 'Senior Staff / Specialist', rankOrder: 2 },
        { code: 'L3', name: 'Team Lead / Supervisor', rankOrder: 3 },
        { code: 'L4', name: 'Manager / Section Head', rankOrder: 4 },
        { code: 'L5', name: 'Director / Department Head', rankOrder: 5 },
        { code: 'L6', name: 'Executive / C-Level', rankOrder: 6 },
    ];
    await db.insert(jobLevels).values(levels).onConflictDoNothing();

    // --- 2. Payroll Components (PH-specific) ---
    const components = [
        // Standard Earnings
        { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', isTaxable: true, isRecurring: true },
        { code: 'OT', name: 'Overtime Pay', type: 'EARNING', isTaxable: true, isRecurring: false },
        { code: 'ND', name: 'Night Differential Pay', type: 'EARNING', isTaxable: true, isRecurring: false },
        { code: 'HOL_PAY', name: 'Holiday Pay', type: 'EARNING', isTaxable: true, isRecurring: false },

        // Standard Allowances (Taxable)
        { code: 'TRANSPO', name: 'Transportation Allowance', type: 'EARNING', isTaxable: true, isRecurring: true },
        { code: 'MEAL', name: 'Meal Allowance', type: 'EARNING', isTaxable: true, isRecurring: true },

        // De Minimis Benefits (Tax-exempt up to a limit)
        { code: 'RICE', name: 'Rice Subsidy', type: 'EARNING', isTaxable: true, isDeMinimis: true, taxExemptLimit: '2000.00', isRecurring: true },
        { code: 'CLOTHING', name: 'Clothing Allowance', type: 'EARNING', isTaxable: true, isDeMinimis: true, taxExemptLimit: '500.00', isRecurring: true }, // 6000/12
        { code: 'MEDICAL', name: 'Medical Cash Allowance', type: 'EARNING', isTaxable: true, isDeMinimis: true, taxExemptLimit: '833.33', isRecurring: true }, // 10000/12

        // Bonuses
        { code: 'BONUS_13', name: '13th Month Pay', type: 'EARNING', isTaxable: true, isRecurring: false, taxExemptLimit: '90000.00' }, // This limit is for "other benefits"
        { code: 'BONUS_PERF', name: 'Performance Bonus', type: 'EARNING', isTaxable: true, isRecurring: false },

        // Standard Deductions (Statutory)
        { code: 'D_SSS', name: 'SSS Contribution', type: 'DEDUCTION', isTaxable: false, isStatutory: true, isRecurring: true },
        { code: 'D_PHIC', name: 'PhilHealth Contribution', type: 'DEDUCTION', isTaxable: false, isStatutory: true, isRecurring: true },
        { code: 'D_HDMF', name: 'Pag-IBIG Contribution', type: 'DEDUCTION', isTaxable: false, isStatutory: true, isRecurring: true },
        { code: 'D_WTAX', name: 'Withholding Tax', type: 'DEDUCTION', isTaxable: false, isStatutory: true, isRecurring: true },

        // Other Deductions
        { code: 'D_LATE', name: 'Tardiness / Undertime', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
        { code: 'D_ABSENCE', name: 'Absences', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
        { code: 'D_LOAN_SSS', name: 'SSS Loan', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
        { code: 'D_LOAN_HDMF', name: 'Pag-IBIG Loan', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
    ];
    await db.insert(payrollComponents).values(components).onConflictDoNothing();
}

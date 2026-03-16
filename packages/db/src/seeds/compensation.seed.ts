import { sql } from "drizzle-orm";
import { jobLevels } from "../schema/job-levels";
import { payrollComponents } from "../schema/payroll-components";
import { compensationTemplates } from "../schema/compensation-templates";
import { compensationTemplateComponents } from "../schema/compensation-template-components";

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
        { code: 'CONTRACTOR', name: 'Contractor / Freelancer', rankOrder: 99 },
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

        // Employer Shares (Statutory)
        { code: 'ER_SSS', name: 'Employer SSS Contribution', type: 'EMPLOYER_COST', isTaxable: false, isStatutory: true, isRecurring: true },
        { code: 'ER_PHIC', name: 'Employer PhilHealth Contribution', type: 'EMPLOYER_COST', isTaxable: false, isStatutory: true, isRecurring: true },
        { code: 'ER_HDMF', name: 'Employer Pag-IBIG Contribution', type: 'EMPLOYER_COST', isTaxable: false, isStatutory: true, isRecurring: true },

        // Other Deductions
        { code: 'D_LATE', name: 'Tardiness / Undertime', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
        { code: 'D_ABSENCE', name: 'Absences', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
        { code: 'D_LOAN_SSS', name: 'SSS Loan', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
        { code: 'D_LOAN_HDMF', name: 'Pag-IBIG Loan', type: 'DEDUCTION', isTaxable: false, isRecurring: false },
    ];
    await db.insert(payrollComponents).values(components).onConflictDoNothing();

    // Fetch inserted components to get their UUIDs for the templates
    const insertedComponents = await db.select().from(payrollComponents);
    const componentMap: Record<string, string> = {};
    for (const comp of insertedComponents) {
        componentMap[comp.code] = comp.id;
    }

    // Fetch job levels to link them
    const insertedLevels = await db.select().from(jobLevels);
    const levelMap: Record<string, string> = {};
    for (const lvl of insertedLevels) {
        levelMap[lvl.code] = lvl.id;
    }

    // --- 3. Compensation Templates ---
    const templates = [
        { code: 'TPL_L1', name: 'L1 Compensation Package', description: 'Standard package for L1', jobLevelId: levelMap['L1'] },
        { code: 'TPL_L2', name: 'L2 Compensation Package', description: 'Standard package for L2', jobLevelId: levelMap['L2'] },
        { code: 'TPL_L3', name: 'L3 Compensation Package', description: 'Standard package for L3', jobLevelId: levelMap['L3'] },
        { code: 'TPL_L4', name: 'L4 Compensation Package', description: 'Standard package for L4', jobLevelId: levelMap['L4'] },
        { code: 'TPL_L5', name: 'L5 Compensation Package', description: 'Standard package for L5', jobLevelId: levelMap['L5'] },
        { code: 'TPL_L6', name: 'L6 Compensation Package', description: 'Standard package for L6', jobLevelId: levelMap['L6'] },
        { code: 'TPL_CONTRACTOR', name: 'Contractor Compensation Package', description: 'Standard package for Contractor', jobLevelId: levelMap['CONTRACTOR'] },
    ];
    await db.insert(compensationTemplates).values(templates).onConflictDoNothing();
    
    // Fetch inserted templates to get their UUIDs
    const insertedTemplates = await db.select().from(compensationTemplates);
    const templateMap: Record<string, string> = {};
    for (const tpl of insertedTemplates) {
        templateMap[tpl.code] = tpl.id;
    }

    // --- 4. Compensation Template Components ---
    const tplComponents: any[] = [];

    // Helper to generate components for a template
    function generateTemplateComponents(templateCode: string, basicPay: string) {
        if (!templateMap[templateCode]) return;
        const codes = [
            { code: 'BASIC', amount: basicPay },
            { code: 'TRANSPO', amount: '1500.00' },
            { code: 'MEAL', amount: '1500.00' },
            { code: 'RICE', amount: '2000.00' },
            { code: 'CLOTHING', amount: '500.00' },
            { code: 'MEDICAL', amount: '833.33' },
            { code: 'D_SSS', amount: '0.00' },
            { code: 'D_PHIC', amount: '0.00' },
            { code: 'D_HDMF', amount: '0.00' },
            { code: 'ER_SSS', amount: '0.00' },
            { code: 'ER_PHIC', amount: '0.00' },
            { code: 'ER_HDMF', amount: '0.00' },
            { code: 'D_WTAX', amount: '0.00' },
            { code: 'BONUS_13', amount: '0.00' },
            { code: 'BONUS_PERF', amount: '0.00' },
        ];
        
        for (const item of codes) {
            if (componentMap[item.code]) {
                tplComponents.push({
                    templateId: templateMap[templateCode],
                    payrollComponentId: componentMap[item.code],
                    amount: item.amount
                });
            }
        }
    }

    generateTemplateComponents('TPL_L1', '25000.00');
    generateTemplateComponents('TPL_L2', '35000.00');
    generateTemplateComponents('TPL_L3', '50000.00');
    generateTemplateComponents('TPL_L4', '80000.00');
    generateTemplateComponents('TPL_L5', '120000.00');
    generateTemplateComponents('TPL_L6', '200000.00');

    // TPL_CONTRACTOR: Contractor Employee
    if (templateMap['TPL_CONTRACTOR']) {
        const contractorCodes = [
            { code: 'BASIC', amount: '45000.00' }, // Professional Fee equivalent
            { code: 'HOL_PAY', amount: '0.00' },
            { code: 'D_WTAX', amount: '0.00' }, // Withholding standard flat rate (often 5% or 10% in PH, amount 0 is computed at payroll runtime)
        ];
        for (const item of contractorCodes) {
            if (componentMap[item.code]) {
                tplComponents.push({
                    templateId: templateMap['TPL_CONTRACTOR'],
                    payrollComponentId: componentMap[item.code],
                    amount: item.amount
                });
            }
        }
    }

    if (tplComponents.length > 0) {
        await db.insert(compensationTemplateComponents).values(tplComponents).onConflictDoNothing();
    }
}

import { eq, and, between, lte, sql } from 'drizzle-orm';
import { 
    employees, 
    employeeCompensations, 
    payrollComponents, 
    payrollBatches, 
    payslips, 
    payslipItems, 
    attendanceLogs, 
    statutoryBrackets, 
    premiumPayRates,
    thirteenthMonthLedger,
    employeeProfiles
} from '../schema';

export async function seedPayroll(db: any) {
    console.log('🚀 Simulating 6 months of historical payroll (semi-monthly)...');

    const today = new Date('2026-03-17'); // Source of truth
    const employeeList = await db.select().from(employees).where(eq(employees.status, 'ACTIVE'));

    // 1. Define the 12 semi-monthly periods for the last 6 months
    const periods: { start: Date; end: Date; name: string }[] = [];
    
    for (let i = 5; i >= 0; i--) {
        const year = i > 2 ? 2025 : 2026; // Rough estimate for the seed logic
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yearNum = monthDate.getFullYear();
        const monthNum = monthDate.getMonth();
        const monthName = monthDate.toLocaleString('default', { month: 'long' });

        // Period 1: 1st to 15th
        periods.push({
            start: new Date(yearNum, monthNum, 1),
            end: new Date(yearNum, monthNum, 15),
            name: `${monthName} 1-15, ${yearNum}`
        });

        // Period 2: 16th to End
        periods.push({
            start: new Date(yearNum, monthNum, 16),
            end: new Date(yearNum, monthNum + 1, 0),
            name: `${monthName} 16-End, ${yearNum}`
        });
    }

    // Add March 1-15 if it passed
    periods.push({
        start: new Date(2026, 2, 1),
        end: new Date(2026, 2, 15),
        name: `March 1-15, 2026`
    });

    // 2. Pre-fetch shared data
    const statutoryGrid = await db.select().from(statutoryBrackets);
    const premiumGrid = await db.select().from(premiumPayRates);

    for (const period of periods) {
        if (period.start > today) continue;

        const startIso = period.start.toISOString().split('T')[0];
        const endIso = period.end.toISOString().split('T')[0];
        
        console.log(`  - Processing batch: ${period.name}...`);

        // Create Batch
        const [batch] = await db.insert(payrollBatches).values({
            name: period.name,
            startDate: startIso,
            endDate: endIso,
            status: 'COMPLETED',
            totalAmount: '0', // Will update later
            processedAt: new Date(),
        }).returning();

        let batchTotal = 0;

        for (const emp of employeeList) {
            // Replicate core calculation logic
            const compensations = await db
                .select({
                    amount: employeeCompensations.amount,
                    code: payrollComponents.code,
                    name: payrollComponents.name,
                    type: payrollComponents.type,
                    isTaxable: payrollComponents.isTaxable,
                    isDeMinimis: payrollComponents.isDeMinimis,
                    taxExemptLimit: payrollComponents.taxExemptLimit,
                })
                .from(employeeCompensations)
                .innerJoin(payrollComponents, eq(employeeCompensations.payrollComponentId, payrollComponents.id))
                .where(eq(employeeCompensations.employeeId, emp.id));

            const logs = await db
                .select()
                .from(attendanceLogs)
                .where(
                    and(
                        eq(attendanceLogs.employeeId, emp.id),
                        between(attendanceLogs.workDate, startIso, endIso)
                    )
                );

            const profiles = await db.select().from(employeeProfiles).where(eq(employeeProfiles.employeeId, emp.id));
            const profile = profiles[0];
            const factorRate = Number(profile?.factorRate || 261);
            const monthlyBasic = Number(compensations.find((c: any) => c.code === 'BASIC')?.amount || 0);
            const dailyRate = (monthlyBasic * 12) / factorRate;
            const hourlyRate = dailyRate / 8;

            const items: any[] = [];
            let grossPay = 0;
            let taxableIncome = 0;
            let totalDeductions = 0;

            // Basic Pay (Divide by 2 for semi-monthly)
            const basicSemiAmount = monthlyBasic / 2;
            items.push({ code: 'BASIC', name: 'Basic Pay', type: 'EARNING', amount: basicSemiAmount.toFixed(2) });
            grossPay += basicSemiAmount;
            taxableIncome += basicSemiAmount;

            // Attendance Earning Premiums
            const otHours = logs.reduce((acc: number, l: any) => acc + Number(l.overtimeHours || 0), 0);
            if (otHours > 0) {
                const otRate = premiumGrid.find((p: any) => p.code === 'ORD_OT')?.multiplier || '1.25';
                const otAmt = otHours * hourlyRate * Number(otRate);
                items.push({ code: 'OT', name: 'Overtime Pay', type: 'EARNING', amount: otAmt.toFixed(2) });
                grossPay += otAmt;
                taxableIncome += otAmt;
            }

            // Attendance Deductions (Lates/UT)
            let tardyHours = 0;
            logs.forEach((l: any) => {
                if (l.scheduledInAt && l.actualInAt) {
                    const diff = new Date(l.actualInAt).getTime() - new Date(l.scheduledInAt).getTime();
                    if (diff > 0) tardyHours += diff / (1000 * 60 * 60);
                }
            });
            if (tardyHours > 0) {
                const lateAmt = tardyHours * hourlyRate;
                items.push({ code: 'D_LATE', name: 'Tardiness', type: 'DEDUCTION', amount: lateAmt.toFixed(2) });
                totalDeductions += lateAmt;
            }

            // Other earnings (Allowances - divide by 2)
            compensations.filter((c: any) => c.type === 'EARNING' && c.code !== 'BASIC').forEach((c: any) => {
                const semiAmt = Number(c.amount) / 2;
                items.push({ code: c.code, name: c.name, type: 'EARNING', amount: semiAmt.toFixed(2) });
                grossPay += semiAmt;
                if (c.isTaxable) {
                   const limit = Number(c.taxExemptLimit || 0) / 2;
                   taxableIncome += Math.max(0, semiAmt - limit);
                }
            });

            // Simplified Statutories (Only once a month, let's say 2nd period)
            const isSecondPeriod = period.end.getDate() > 15;
            if (isSecondPeriod) {
                const sss = statutoryGrid.find((b: any) => b.type === 'SSS' && monthlyBasic >= Number(b.minCompensation) && (b.maxCompensation === null || monthlyBasic <= Number(b.maxCompensation)));
                if (sss) {
                    const amt = Number(sss.employeeShareAmount);
                    items.push({ code: 'D_SSS', name: 'SSS', type: 'DEDUCTION', amount: amt.toFixed(2) });
                    totalDeductions += amt;
                }
                const phic = statutoryGrid.find((b: any) => b.type === 'PHIC');
                if (phic) {
                    const amt = monthlyBasic * Number(phic.employeeShareRate || 0.025);
                    items.push({ code: 'D_PHIC', name: 'PhilHealth', type: 'DEDUCTION', amount: amt.toFixed(2) });
                    totalDeductions += amt;
                }
                const hdmf = statutoryGrid.find((b: any) => b.type === 'HDMF');
                if (hdmf) {
                    const amt = Number(hdmf.employeeShareAmount);
                    items.push({ code: 'D_HDMF', name: 'Pag-IBIG', type: 'DEDUCTION', amount: amt.toFixed(2) });
                    totalDeductions += amt;
                }
            }

            const netPay = grossPay - totalDeductions;

            // Save Payslip
            const [savedPayslip] = await db.insert(payslips).values({
                batchId: batch.id,
                employeeId: emp.id,
                grossPay: grossPay.toFixed(2),
                totalDeductions: totalDeductions.toFixed(2),
                netPay: netPay.toFixed(2),
            }).returning();

            // Save Items
            const itemsToInsert = items.map((item: any) => ({
                payslipId: savedPayslip.id,
                code: item.code,
                name: item.name,
                type: item.type,
                amount: item.amount,
            }));
            if (itemsToInsert.length > 0) {
                await db.insert(payslipItems).values(itemsToInsert);
            }

            // Record 13th Month Accrual
            const accrualAmt = (basicSemiAmount) / 12;
            await db.insert(thirteenthMonthLedger).values({
                employeeId: emp.id,
                payslipId: savedPayslip.id,
                year: period.start.getFullYear().toString(),
                month: (period.start.getMonth() + 1).toString().padStart(2, '0'),
                accrualAmount: accrualAmt.toFixed(2),
            });

            batchTotal += netPay;
        }

        // Update Batch Total
        await db.update(payrollBatches).set({ totalAmount: batchTotal.toFixed(2) }).where(eq(payrollBatches.id, batch.id));
    }

    console.log('✅ Payroll Simulation Complete!');
}

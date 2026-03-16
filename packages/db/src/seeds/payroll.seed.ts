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
    employeeProfiles,
    holidays
} from '../schema';
import { differenceInDays, parseISO } from 'date-fns';

export async function seedPayroll(db: any) {
    const today = new Date('2026-03-17'); // Source of truth
    const employeeList = await db.select().from(employees).where(eq(employees.status, 'ACTIVE'));

    console.log('🚀 Simulating semi-monthly historical payroll (2 months)...');

    // 1. Define the semi-monthly periods for the last 2 months
    const periods: { start: Date; end: Date; name: string }[] = [];
    
    // We'll generate for current month and previous month
    for (let i = 1; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yearNum = monthDate.getFullYear();
        const monthNum = monthDate.getMonth();
        const monthName = monthDate.toLocaleString('default', { month: 'long' });

        // Period 1: 1st to 15th
        const p1Start = new Date(yearNum, monthNum, 1);
        const p1End = new Date(yearNum, monthNum, 15);
        if (p1Start <= today) {
            periods.push({
                start: p1Start,
                end: p1End,
                name: `${monthName} 1-15, ${yearNum}`
            });
        }

        // Period 2: 16th to End
        const p2Start = new Date(yearNum, monthNum, 16);
        const p2End = new Date(yearNum, monthNum + 1, 0);
        if (p2Start <= today) {
            periods.push({
                start: p2Start,
                end: p2End,
                name: `${monthName} 16-End, ${yearNum}`
            });
        }
    }

    // 2. Pre-fetch shared data
    const statutoryGrid = await db.select().from(statutoryBrackets);
    const premiumGrid = await db.select().from(premiumPayRates);

    for (const period of periods) {
        if (period.start > today) continue;

        const startIso = period.start.toISOString().split('T')[0];
        const endIso = period.end.toISOString().split('T')[0];
        
        // Detect Frequency
        const dayDiff = differenceInDays(period.end, period.start) + 1;
        const isSemiMonthly = dayDiff <= 16;
        const frequencyMultiplier = isSemiMonthly ? 0.5 : 1.0;

        // Fetch Holidays for the period
        const holidayList = await db.select().from(holidays).where(between(holidays.date, startIso, endIso));

        console.log(`  - Processing batch: ${period.name}...`);

        // Create Batch
        const [batch] = await db.insert(payrollBatches).values({
            name: period.name,
            startDate: startIso,
            endDate: endIso,
            status: 'COMPLETED',
            totalAmount: '0', 
            processedAt: new Date(),
        }).returning();

        let batchTotal = 0;

        for (const emp of employeeList) {
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

            // A. Basic Pay (Frequency Adjusted)
            const basicCycleAmount = monthlyBasic * frequencyMultiplier;
            items.push({ 
                code: 'BASIC', 
                name: 'Basic Pay', 
                type: 'EARNING', 
                amount: basicCycleAmount.toFixed(2),
                description: isSemiMonthly ? `Semi-monthly Basic (50% of ${monthlyBasic})` : `Monthly Basic`,
            });
            grossPay += basicCycleAmount;
            taxableIncome += basicCycleAmount;

            // B. Attendance Premiums
            let totalOTAmount = 0;
            let totalNDAmount = 0;
            let totalHolidayPremAmount = 0;
            let totalLatesAmount = 0;

            for (const log of logs) {
                const logDate = log.workDate;
                const hDay = holidayList.find((h: any) => h.date === logDate);
                const isRestDay = !log.scheduledInAt;
                const getPremiumValue = (code: string) => Number(premiumGrid.find((p: any) => p.code === code)?.multiplier || 1.0);

                if (Number(log.overtimeHours) > 0) {
                    let otMultiplier = getPremiumValue('ORD_OT');
                    if (hDay?.type === 'REGULAR') otMultiplier = getPremiumValue('REG_HOL_OT');
                    else if (isRestDay) otMultiplier = getPremiumValue('REST_DAY_OT');
                    totalOTAmount += Number(log.overtimeHours) * hourlyRate * otMultiplier;
                }

                if (Number(log.nightDiffHours) > 0) {
                    totalNDAmount += Number(log.nightDiffHours) * hourlyRate * (getPremiumValue('ND') - 1);
                }

                if (Number(log.holidayHours) > 0 || isRestDay) {
                    let premMultiplier = 0;
                    if (hDay?.type === 'REGULAR') premMultiplier = getPremiumValue('REG_HOL') - 1;
                    else if (isRestDay) premMultiplier = getPremiumValue('REST_DAY') - 1;
                    
                    if (premMultiplier > 0) {
                        totalHolidayPremAmount += Math.min(Number(log.totalHours || 8), 8) * hourlyRate * premMultiplier;
                    }
                }

                if (log.scheduledInAt && log.actualInAt) {
                    const diff = new Date(log.actualInAt).getTime() - new Date(log.scheduledInAt).getTime();
                    if (diff > 0) totalLatesAmount += (diff / (1000 * 60 * 60)) * hourlyRate;
                }
            }

            if (totalOTAmount > 0) {
                items.push({ code: 'OT', name: 'Overtime Pay', type: 'EARNING', amount: totalOTAmount.toFixed(2) });
                grossPay += totalOTAmount;
                taxableIncome += totalOTAmount;
            }
            if (totalNDAmount > 0) {
                items.push({ code: 'ND', name: 'Night Differential', type: 'EARNING', amount: totalNDAmount.toFixed(2) });
                grossPay += totalNDAmount;
                taxableIncome += totalNDAmount;
            }
            if (totalHolidayPremAmount > 0) {
                items.push({ code: 'PREM_PAY', name: 'Holiday/Rest Day Premium', type: 'EARNING', amount: totalHolidayPremAmount.toFixed(2) });
                grossPay += totalHolidayPremAmount;
                taxableIncome += totalHolidayPremAmount;
            }
            if (totalLatesAmount > 0) {
                items.push({ code: 'D_LATE', name: 'Tardiness / Undertime', type: 'DEDUCTION', amount: totalLatesAmount.toFixed(2) });
                totalDeductions += totalLatesAmount;
            }

            // C. Other earnings (Allowances - Frequency Adjusted)
            compensations.filter((c: any) => c.type === 'EARNING' && c.code !== 'BASIC').forEach((c: any) => {
                const amt = Number(c.amount) * frequencyMultiplier;
                items.push({ code: c.code, name: c.name, type: 'EARNING', amount: amt.toFixed(2) });
                grossPay += amt;
                if (c.isTaxable) {
                   const limit = Number(c.taxExemptLimit || 0) * frequencyMultiplier;
                   taxableIncome += Math.max(0, amt - limit);
                }
            });

            // D. Statutories (Once a month - 2nd Period)
            const isStatutoryPeriod = period.end.getDate() > 15 || !isSemiMonthly;
            if (isStatutoryPeriod) {
                const sss = statutoryGrid.find((b: any) => b.type === 'SSS' && monthlyBasic >= Number(b.minCompensation) && (b.maxCompensation === null || monthlyBasic <= Number(b.maxCompensation)));
                if (sss) {
                    const amt = Number(sss.employeeShareAmount);
                    items.push({ code: 'SSS', name: 'SSS Contribution', type: 'DEDUCTION', amount: amt.toFixed(2) });
                    totalDeductions += amt;
                    items.push({ code: 'ER_SSS', name: 'Employer SSS', type: 'EMPLOYER_COST', amount: Number(sss.employerShareAmount || 0).toFixed(2) });
                }
                const phic = statutoryGrid.find((b: any) => b.type === 'PHIC');
                if (phic) {
                    const amt = monthlyBasic * Number(phic.employeeShareRate || 0.025);
                    items.push({ code: 'PHIC', name: 'PhilHealth', type: 'DEDUCTION', amount: amt.toFixed(2) });
                    totalDeductions += amt;
                    items.push({ code: 'ER_PHIC', name: 'Employer PhilHealth', type: 'EMPLOYER_COST', amount: amt.toFixed(2) });
                }
                const hdmf = statutoryGrid.find((b: any) => b.type === 'HDMF');
                if (hdmf) {
                    const amt = Number(hdmf.employeeShareAmount || 200);
                    items.push({ code: 'HDMF', name: 'Pag-IBIG', type: 'DEDUCTION', amount: amt.toFixed(2) });
                    totalDeductions += amt;
                    items.push({ code: 'ER_HDMF', name: 'Employer Pag-IBIG', type: 'EMPLOYER_COST', amount: amt.toFixed(2) });
                }
            }

            const netPay = Math.max(0, grossPay - totalDeductions);

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
            const accrualAmt = basicCycleAmount / 12;
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

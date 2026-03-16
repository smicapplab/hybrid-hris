import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { 
    employees, 
    employeeProfiles, 
    employeeCompensations, 
    payrollComponents, 
    statutoryBrackets, 
    premiumPayRates,
    attendanceLogs,
    overtimeRequests,
    holidays
} from '@hybrid-hris/db';
import { eq, and, gte, lte, sql, between } from 'drizzle-orm';
import { PremiumPayRate } from '@hybrid-hris/db';
import { differenceInDays, format, parseISO } from 'date-fns';

@Injectable()
export class PayslipsService {
    constructor(private readonly db: DatabaseService) {}

    /**
     * The core PH payroll calculation logic for a single employee
     */
    async calculateEmployeePayslip(employeeId: string, startDate: string, endDate: string) {
        // 1. Detect Frequency (Semi-monthly vs Monthly)
        const dateStart = parseISO(startDate);
        const dateEnd = parseISO(endDate);
        const dayDiff = differenceInDays(dateEnd, dateStart) + 1;
        const isSemiMonthly = dayDiff <= 16;
        const frequencyMultiplier = isSemiMonthly ? 0.5 : 1.0;

        // 2. Fetch Employee Data
        const [employee] = await this.db.db
            .select()
            .from(employees)
            .leftJoin(employeeProfiles, eq(employees.id, employeeProfiles.employeeId))
            .where(eq(employees.id, employeeId));

        if (!employee) return null;

        // 3. Fetch Data Prerequisites (Compensations, Statutories, Premiums, Holidays)
        const todayStr = new Date().toISOString().split('T')[0];
        const [compensations, statutoryGrid, premiumGrid, holidayList] = await Promise.all([
            this.db.db
                .select({
                    amount: employeeCompensations.amount,
                    code: payrollComponents.code,
                    name: payrollComponents.name,
                    type: payrollComponents.type,
                    isTaxable: payrollComponents.isTaxable,
                    isStatutory: payrollComponents.isStatutory,
                    isDeMinimis: payrollComponents.isDeMinimis,
                    taxExemptLimit: payrollComponents.taxExemptLimit,
                })
                .from(employeeCompensations)
                .innerJoin(payrollComponents, eq(employeeCompensations.payrollComponentId, payrollComponents.id))
                .where(eq(employeeCompensations.employeeId, employeeId)),
            this.db.db.select().from(statutoryBrackets).where(
                and(
                    lte(statutoryBrackets.effectiveFrom, todayStr),
                    sql`${statutoryBrackets.effectiveTo} IS NULL OR ${statutoryBrackets.effectiveTo} >= ${todayStr}`
                )
            ),
            this.db.db.select().from(premiumPayRates),
            this.db.db.select().from(holidays).where(between(holidays.date, startDate, endDate))
        ]);

        // 4. Fetch Attendance Logs
        const logs = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    between(attendanceLogs.workDate, startDate, endDate)
                )
            );

        // 5. Rate Calculations (Factor Rate logic)
        const monthlyBasic = Number(compensations.find(c => c.code === 'BASIC')?.amount || 0);
        const factorRate = Number(employee.employee_profiles?.factorRate || 261);
        const dailyRate = (monthlyBasic * 12) / factorRate;
        const hourlyRate = dailyRate / 8;

        // 6. Build Payslip Items
        const items = [];
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

        // B. Dynamic Earnings (Attendance-based Premiums)
        let totalOTAmount = 0;
        let totalNDAmount = 0;
        let totalHolidayPremAmount = 0;
        let totalLatesAmount = 0;

        for (const log of logs) {
            const logDate = log.workDate;
            const hDay = holidayList.find(h => h.date === logDate);
            const isRestDay = !log.scheduledInAt; // Simplification for rest day detection
            
            // Classification helper
            const getPremiumValue = (code: string) => Number(premiumGrid.find(p => p.code === code)?.multiplier || 1.0);

            // 1. Overtime Calculation
            if (Number(log.overtimeHours) > 0) {
                let otMultiplier = getPremiumValue('ORD_OT');
                if (hDay?.type === 'REGULAR') otMultiplier = getPremiumValue('REG_HOL_OT');
                else if (hDay?.type === 'SPECIAL') otMultiplier = isRestDay ? getPremiumValue('SPE_HOL_REST') * 1.3 : getPremiumValue('SPE_HOL') * 1.3;
                else if (isRestDay) otMultiplier = getPremiumValue('REST_DAY_OT');

                totalOTAmount += Number(log.overtimeHours) * hourlyRate * otMultiplier;
            }

            // 2. Night Differential (10% standard premium on top of basic/OT)
            if (Number(log.nightDiffHours) > 0) {
                const ndMultiplier = getPremiumValue('ND') - 1; // 1.10 -> 0.10 premium
                totalNDAmount += Number(log.nightDiffHours) * hourlyRate * ndMultiplier;
            }

            // 3. Holiday/Rest Day Premiums (Hours worked during regular shift)
            if (Number(log.totalHours) > 0) {
                let premMultiplier = 0;
                if (hDay?.type === 'REGULAR') premMultiplier = getPremiumValue('REG_HOL') - 1;
                else if (hDay?.type === 'SPECIAL') premMultiplier = isRestDay ? getPremiumValue('SPE_HOL_REST') - 1 : getPremiumValue('SPE_HOL') - 1;
                else if (isRestDay) premMultiplier = getPremiumValue('REST_DAY') - 1;

                if (premMultiplier > 0) {
                    // Only apply to hours WITHIN the standard 8-hour shift
                    const normalHours = Math.min(Number(log.totalHours), 8);
                    totalHolidayPremAmount += normalHours * hourlyRate * premMultiplier;
                }
            }

            // 4. Lates/Undertime
            let missedHours = 0;
            if (log.scheduledInAt && log.actualInAt) {
                const lateDiff = new Date(log.actualInAt).getTime() - new Date(log.scheduledInAt).getTime();
                if (lateDiff > 0) missedHours += lateDiff / (1000 * 60 * 60);
            }
            if (log.scheduledOutAt && log.actualOutAt) {
                const utDiff = new Date(log.scheduledOutAt).getTime() - new Date(log.actualOutAt).getTime();
                if (utDiff > 0) missedHours += utDiff / (1000 * 60 * 60);
            }
            totalLatesAmount += missedHours * hourlyRate;
        }

        // Add Attendance Items to Payslip
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

        // C. Allowances (Frequency Adjusted)
        compensations.filter(c => c.type === 'EARNING' && c.code !== 'BASIC').forEach(c => {
            const amt = Number(c.amount) * frequencyMultiplier;
            items.push({ code: c.code, name: c.name, type: 'EARNING', amount: amt.toFixed(2) });
            grossPay += amt;
            if (c.isTaxable) {
                const limit = Number(c.taxExemptLimit || 0) * frequencyMultiplier;
                taxableIncome += Math.max(0, amt - limit);
            }
        });

        // D. Statutory Deductions (Frequency and Timing Aware)
        // Usually PH companies compute full statutory once a month (e.g. 2nd cutoff)
        const isStatutoryPeriod = dateEnd.getDate() > 15 || !isSemiMonthly;
        
        if (isStatutoryPeriod) {
            const sss = statutoryGrid.find(b => b.type === 'SSS' && monthlyBasic >= Number(b.minCompensation) && (b.maxCompensation === null || monthlyBasic <= Number(b.maxCompensation)));
            if (sss) {
                const amt = Number(sss.employeeShareAmount);
                items.push({ code: 'SSS', name: 'SSS Contribution', type: 'DEDUCTION', amount: amt.toFixed(2) });
                totalDeductions += amt;
                items.push({ code: 'ER_SSS', name: 'Employer SSS', type: 'EMPLOYER_COST', amount: Number(sss.employerShareAmount || 0).toFixed(2) });
            }

            const phic = statutoryGrid.find(b => b.type === 'PHIC' && monthlyBasic >= Number(b.minCompensation) && (b.maxCompensation === null || monthlyBasic <= Number(b.maxCompensation)));
            if (phic) {
                const eeRate = Number(phic.employeeShareRate || 0);
                const eeAmt = phic.employeeShareAmount ? Number(phic.employeeShareAmount) : monthlyBasic * eeRate;
                items.push({ code: 'PHIC', name: 'PhilHealth', type: 'DEDUCTION', amount: eeAmt.toFixed(2) });
                totalDeductions += eeAmt;
                const erAmt = phic.employerShareAmount ? Number(phic.employerShareAmount) : monthlyBasic * Number(phic.employerShareRate || eeRate);
                items.push({ code: 'ER_PHIC', name: 'Employer PhilHealth', type: 'EMPLOYER_COST', amount: erAmt.toFixed(2) });
            }

            const hdmf = statutoryGrid.find(b => b.type === 'HDMF' && monthlyBasic >= Number(b.minCompensation) && (b.maxCompensation === null || monthlyBasic <= Number(b.maxCompensation)));
            if (hdmf) {
                const eeAmt = Number(hdmf.employeeShareAmount || 100);
                items.push({ code: 'HDMF', name: 'Pag-IBIG', type: 'DEDUCTION', amount: eeAmt.toFixed(2) });
                totalDeductions += eeAmt;
                items.push({ code: 'ER_HDMF', name: 'Employer Pag-IBIG', type: 'EMPLOYER_COST', amount: Number(hdmf.employerShareAmount || eeAmt).toFixed(2) });
            }
        }

        // E. Withholding Tax (WTAX)
        const taxableNet = taxableIncome - totalDeductions;
        const taxBracket = statutoryGrid
            .filter(b => b.type === 'WTAX' && taxableNet >= Number(b.minCompensation))
            .sort((a, b) => Number(b.minCompensation) - Number(a.minCompensation))[0];
        
        if (taxBracket) {
            const taxBase = Number(taxBracket.baseTaxAmount);
            const taxExcess = (taxableNet - Number(taxBracket.minCompensation)) * Number(taxBracket.excessTaxRate);
            const totalTax = taxBase + taxExcess;
            items.push({ code: 'WTAX', name: 'Withholding Tax', type: 'DEDUCTION', amount: totalTax.toFixed(2) });
            totalDeductions += totalTax;
        }

        const netPay = Math.max(0, grossPay - totalDeductions);

        return {
            employeeId,
            grossPay: grossPay.toFixed(2),
            totalDeductions: totalDeductions.toFixed(2),
            netPay: netPay.toFixed(2),
            items
        };
    }
}

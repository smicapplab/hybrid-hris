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
    overtimeRequests
} from '@hybrid-hris/db';
import { eq, and, gte, lte, sql, between } from 'drizzle-orm';
import { PremiumPayRate } from '@hybrid-hris/db';

@Injectable()
export class PayslipsService {
    constructor(private readonly db: DatabaseService) {}

    /**
     * The core PH payroll calculation logic for a single employee
     */
    async calculateEmployeePayslip(employeeId: string, startDate: string, endDate: string) {
        // 1. Fetch Employee Data
        const [employee] = await this.db.db
            .select()
            .from(employees)
            .leftJoin(employeeProfiles, eq(employees.id, employeeProfiles.employeeId))
            .where(eq(employees.id, employeeId));

        if (!employee) return null;

        // 2. Fetch Compensation Reference
        const compensations = await this.db.db
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
            .where(eq(employeeCompensations.employeeId, employeeId));

        // 3. Fetch Statutory Brackets & Premium Multipliers
        const todayStr = new Date().toISOString().split('T')[0];
        const [statutoryGrid, premiumGrid] = await Promise.all([
            this.db.db.select().from(statutoryBrackets).where(
                and(
                    lte(statutoryBrackets.effectiveFrom, todayStr),
                    sql`${statutoryBrackets.effectiveTo} IS NULL OR ${statutoryBrackets.effectiveTo} >= ${todayStr}`
                )
            ),
            this.db.db.select().from(premiumPayRates),
        ]);

        // 4. Fetch Attendance & OT Summary
        const logs = await this.db.db
            .select()
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.employeeId, employeeId),
                    between(attendanceLogs.workDate, startDate, endDate)
                )
            );

        // 5. Calculate Hourly Rate (Factor Rate logic)
        const monthlyBasic = Number(compensations.find(c => c.code === 'BASIC')?.amount || 0);
        const factorRate = Number(employee.employee_profiles?.factorRate || 261);
        const dailyRate = (monthlyBasic * 12) / factorRate;
        const hourlyRate = dailyRate / 8;

        // 6. Build Payslip Items
        const items = [];
        let grossPay = 0;
        let taxableIncome = 0;
        let totalDeductions = 0;

        // A. Basic Pay
        items.push({
            code: 'BASIC',
            name: 'Basic Pay',
            type: 'EARNING',
            amount: monthlyBasic.toFixed(2),
            description: `Monthly Basic based on ${factorRate} factor rate`,
        });
        grossPay += monthlyBasic;
        taxableIncome += monthlyBasic;

        // B. Dynamic Earnings (Attendance-based)
        // Overtime
        const otHours = logs.reduce((acc, l) => acc + Number(l.overtimeHours), 0);
        if (otHours > 0) {
            const otRate = premiumGrid.find(p => p.code === 'ORD_OT')?.multiplier || '1.25';
            const otAmt = otHours * hourlyRate * Number(otRate);
            items.push({
                code: 'OT',
                name: 'Overtime Pay',
                type: 'EARNING',
                amount: otAmt.toFixed(2),
                description: `${otHours.toFixed(2)} hrs @ ${otRate}x`
            });
            grossPay += otAmt;
            taxableIncome += otAmt;
        }

        // Night Differential (typically 10% premium)
        const ndHours = logs.reduce((acc, l) => acc + Number(l.nightDiffHours), 0);
        if (ndHours > 0) {
            const ndMultiplier = premiumGrid.find(p => p.code === 'ND')?.multiplier || '1.10';
            const ndRate = Number(ndMultiplier) - 1; // 1.10 -> 0.10 premium
            const ndAmt = ndHours * hourlyRate * ndRate;
            items.push({
                code: 'ND',
                name: 'Night Differential',
                type: 'EARNING',
                amount: ndAmt.toFixed(2),
                description: `${ndHours.toFixed(2)} hrs @ ${ndRate.toFixed(2)}x premium`
            });
            grossPay += ndAmt;
            taxableIncome += ndAmt;
        }

        // Holiday Pay
        const holHours = logs.reduce((acc, l) => acc + Number(l.holidayHours), 0);
        if (holHours > 0) {
            // Simplified: assume Regular Holiday premium (100% extra)
            const holMultiplier = premiumGrid.find(p => p.code === 'REG_HOL')?.multiplier || '2.00';
            const holRate = Number(holMultiplier) - 1; // 2.00 -> 1.00 premium
            const holAmt = holHours * hourlyRate * holRate;
            items.push({
                code: 'HOL_PAY',
                name: 'Holiday Pay',
                type: 'EARNING',
                amount: holAmt.toFixed(2),
                description: `${holHours.toFixed(2)} hrs @ ${holRate.toFixed(2)}x premium`
            });
            grossPay += holAmt;
            taxableIncome += holAmt;
        }

        // C. Attendance-based Deductions (Lates & Undertime)
        let lateHoursTotal = 0;
        let undertimeHoursTotal = 0;

        logs.forEach(l => {
            if (l.scheduledInAt && l.actualInAt) {
                const lateMs = new Date(l.actualInAt).getTime() - new Date(l.scheduledInAt).getTime();
                if (lateMs > 0) lateHoursTotal += lateMs / (1000 * 60 * 60);
            }
            if (l.scheduledOutAt && l.actualOutAt) {
                const utMs = new Date(l.scheduledOutAt).getTime() - new Date(l.actualOutAt).getTime();
                if (utMs > 0) undertimeHoursTotal += utMs / (1000 * 60 * 60);
            }
        });

        if (lateHoursTotal > 0 || undertimeHoursTotal > 0) {
            const tardinessHours = lateHoursTotal + undertimeHoursTotal;
            const lateAmt = tardinessHours * hourlyRate;
            items.push({
                code: 'D_LATE',
                name: 'Tardiness / Undertime',
                type: 'DEDUCTION',
                amount: lateAmt.toFixed(2),
                description: `${tardinessHours.toFixed(2)} total hrs missed`
            });
            totalDeductions += lateAmt;
        }

        // D. Static Allowances (with De Minimis logic)
        compensations.filter(c => c.type === 'EARNING' && c.code !== 'BASIC').forEach(c => {
            const amt = Number(c.amount);
            items.push({
                code: c.code,
                name: c.name,
                type: 'EARNING',
                amount: amt.toFixed(2),
            });
            grossPay += amt;
            
            if (c.isTaxable) {
                if (c.isDeMinimis) {
                    const limit = Number(c.taxExemptLimit || 0);
                    const taxableAmt = Math.max(0, amt - limit);
                    taxableIncome += taxableAmt;
                } else {
                    taxableIncome += amt;
                }
            }
        });

        // E. Statutory Deductions (SSS/PHIC/HDMF)
        const sss = statutoryGrid.find(b => b.type === 'SSS' && monthlyBasic >= Number(b.minCompensation) && (b.maxCompensation === null || monthlyBasic <= Number(b.maxCompensation)));
        if (sss) {
            const amt = Number(sss.employeeShareAmount);
            items.push({ code: 'SSS', name: 'SSS Contribution', type: 'DEDUCTION', amount: amt.toFixed(2) });
            totalDeductions += amt;

            // Employer Share
            const erAmt = Number(sss.employerShareAmount || 0);
            items.push({ 
                code: 'ER_SSS', 
                name: 'Employer SSS', 
                type: 'EMPLOYER_COST', 
                amount: erAmt.toFixed(2),
            });
        }

        const phic = statutoryGrid.find(b => b.type === 'PHIC');
        if (phic) {
            // PhilHealth usually has a rate (e.g. 5% split between ER and EE)
            const rate = Number(phic.employeeShareRate || 0);
            const amt = monthlyBasic * rate; 
            items.push({ code: 'PHIC', name: 'PhilHealth', type: 'DEDUCTION', amount: amt.toFixed(2) });
            totalDeductions += amt;

            // Employer Share (usually matches EE)
            const erRate = Number(phic.employerShareRate || rate);
            const erAmt = monthlyBasic * erRate;
            items.push({ code: 'ER_PHIC', name: 'Employer PhilHealth', type: 'EMPLOYER_COST', amount: erAmt.toFixed(2) });
        }

        const hdmf = statutoryGrid.find(b => b.type === 'HDMF');
        if (hdmf) {
            const amt = Number(hdmf.employeeShareAmount);
            items.push({ code: 'HDMF', name: 'Pag-IBIG', type: 'DEDUCTION', amount: amt.toFixed(2) });
            totalDeductions += amt;

            // Employer Share
            const erAmt = Number(hdmf.employerShareAmount || amt);
            items.push({ code: 'ER_HDMF', name: 'Employer Pag-IBIG', type: 'EMPLOYER_COST', amount: erAmt.toFixed(2) });
        }

        // E. Income Tax (WTAX)
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

        const netPay = grossPay - totalDeductions;

        return {
            employeeId,
            grossPay: grossPay.toFixed(2),
            totalDeductions: totalDeductions.toFixed(2),
            netPay: netPay.toFixed( netPay < 0 ? 0 : 2),
            items
        };
    }
}

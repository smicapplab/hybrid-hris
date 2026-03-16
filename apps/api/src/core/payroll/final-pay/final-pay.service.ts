import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
    employees,
    leaveLedger,
    leaveTypes,
    thirteenthMonthLedger,
    payrollComponents,
    employeeCompensations,
} from '@hybrid-hris/db';
import { eq, and, sql, desc, sum } from 'drizzle-orm';

@Injectable()
export class FinalPayService {
    constructor(private readonly db: DatabaseService) {}

    async calculateFinalPay(employeeId: string) {
        // 1. Fetch Employee & Basic Salary
        const [employee] = await this.db.db
            .select({
                id: employees.id,
                firstName: employees.firstName,
                lastName: employees.lastName,
                hireDate: employees.hireDate,
                factorRate: sql`COALESCE((SELECT factor_rate FROM employee_profiles WHERE employee_id = ${employees.id}), '261.00')`,
            })
            .from(employees)
            .where(eq(employees.id, employeeId));

        if (!employee) throw new NotFoundException('Employee not found');

        const compensations = await this.db.db
            .select({
                amount: employeeCompensations.amount,
                code: payrollComponents.code,
            })
            .from(employeeCompensations)
            .innerJoin(payrollComponents, eq(employeeCompensations.payrollComponentId, payrollComponents.id))
            .where(and(eq(employeeCompensations.employeeId, employeeId), eq(payrollComponents.code, 'BASIC')));

        const monthlyBasic = Number(compensations[0]?.amount || 0);
        const factorRate = Number(employee.factorRate || 261);
        const dailyRate = (monthlyBasic * 12) / factorRate;

        // 2. Fetch Unused Leaves (VL/SL)
        // We take the latest balance for each leave type
        const leaveBalances = await this.db.db
            .select({
                leaveTypeId: leaveLedger.leaveTypeId,
                leaveTypeName: leaveTypes.name,
                leaveTypeCode: leaveTypes.code,
                balance: leaveLedger.balance,
            })
            .from(leaveLedger)
            .innerJoin(leaveTypes, eq(leaveLedger.leaveTypeId, leaveTypes.id))
            .where(eq(leaveLedger.employeeId, employeeId))
            .orderBy(desc(leaveLedger.createdAt));

        // Group by leave type and take the first (latest) entry
        const uniqueBalances = new Map();
        leaveBalances.forEach(lb => {
            if (!uniqueBalances.has(lb.leaveTypeId)) {
                uniqueBalances.set(lb.leaveTypeId, lb);
            }
        });

        const leavePayouts = Array.from(uniqueBalances.values()).map(lb => {
            const balance = Number(lb.balance);
            const amount = balance * dailyRate;
            return {
                code: `LEAVE_${lb.leaveTypeCode}`,
                name: `Unused ${lb.leaveTypeName} Payout`,
                amount: amount.toFixed(2),
                units: balance.toFixed(2),
            };
        });

        // 3. Fetch 13th Month Accruals (current year)
        const currentYear = new Date().getFullYear().toString();
        const thirteenthMonthResult = await this.db.db
            .select({
                total: sum(thirteenthMonthLedger.accrualAmount),
            })
            .from(thirteenthMonthLedger)
            .where(and(eq(thirteenthMonthLedger.employeeId, employeeId), eq(thirteenthMonthLedger.year, currentYear)));

        const thirteenthMonthTotal = Number(thirteenthMonthResult[0]?.total || 0);

        // 4. Consolidate Total
        const items = [
            ...leavePayouts,
            {
                code: '13TH_MONTH',
                name: 'Accrued 13th Month Pay',
                amount: thirteenthMonthTotal.toFixed(2),
            }
        ];

        const totalFinalPay = items.reduce((acc, item) => acc + Number(item.amount), 0);

        return {
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            monthlyBasic: monthlyBasic.toFixed(2),
            dailyRate: dailyRate.toFixed(2),
            items,
            totalFinalPay: totalFinalPay.toFixed(2),
        };
    }
}

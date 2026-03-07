import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
    leaveLedger,
    leavePolicyRules,
    employeeLeavePolicies,
    employees,
} from '@hybrid-hris/db/schema';
import { eq, and, sql, desc, InferSelectModel } from 'drizzle-orm';
import { AccrualMethod } from '@hybrid-hris/domain';

@Injectable()
export class LeaveAccrualsService {
    private readonly logger = new Logger(LeaveAccrualsService.name);

    constructor(private readonly db: DatabaseService) { }

    /**
     * Process monthly accruals for a specific month and year.
     * This is idempotent based on the accrual_key.
     */
    async processMonthlyAccruals(year: number, month: number) {
        const accrualKey = `MONTHLY_${year}_${month.toString().padStart(2, '0')}`;
        this.logger.log(`Processing monthly accruals for ${accrualKey}`);

        // 1. Find all active employees and their current leave policies
        const activeEmployees = await this.db.db
            .select({
                employeeId: employees.id,
                policyId: employeeLeavePolicies.policyId,
            })
            .from(employees)
            .innerJoin(
                employeeLeavePolicies,
                and(
                    eq(employeeLeavePolicies.employeeId, employees.id),
                    sql`${employeeLeavePolicies.effectiveFrom} <= CURRENT_DATE`,
                    sql`(${employeeLeavePolicies.effectiveTo} IS NULL OR ${employeeLeavePolicies.effectiveTo} >= CURRENT_DATE)`
                )
            )
            .where(eq(employees.status, 'ACTIVE'));

        let processedCount = 0;

        for (const emp of activeEmployees) {
            // 2. Get rules for this policy that use MONTHLY accrual
            const rules = await this.db.db
                .select()
                .from(leavePolicyRules)
                .where(
                    and(
                        eq(leavePolicyRules.policyId, emp.policyId),
                        eq(leavePolicyRules.accrualMethod, AccrualMethod.MONTHLY)
                    )
                );

            for (const rule of rules) {
                const result = await this.accrueForEmployee(emp.employeeId, rule, accrualKey);
                if (result) processedCount++;
            }
        }

        return { processedCount, accrualKey };
    }

    private async accrueForEmployee(
        employeeId: string,
        rule: InferSelectModel<typeof leavePolicyRules>,
        accrualKey: string
    ) {
        return this.db.withTransaction(async (tx) => {
            // 1. Check if already accrued (idempotency)
            const [existing] = await tx
                .select({ id: leaveLedger.id })
                .from(leaveLedger)
                .where(
                    and(
                        eq(leaveLedger.employeeId, employeeId),
                        eq(leaveLedger.leaveTypeId, rule.leaveTypeId),
                        eq(leaveLedger.accrualKey, accrualKey)
                    )
                )
                .limit(1);

            if (existing) return false;

            // 2. Get current balance
            const [lastEntry] = await tx
                .select({ balance: leaveLedger.balance })
                .from(leaveLedger)
                .where(
                    and(
                        eq(leaveLedger.employeeId, employeeId),
                        eq(leaveLedger.leaveTypeId, rule.leaveTypeId)
                    )
                )
                .orderBy(desc(leaveLedger.createdAt))
                .limit(1);

            const currentBalance = lastEntry ? parseFloat(lastEntry.balance) : 0;
            const amount = parseFloat(rule.accrualRatePerMonth || '0');

            if (amount <= 0) return false;

            let newBalance = currentBalance + amount;

            // 3. Cap at maxBalance if defined
            if (rule.maxBalance) {
                const max = parseFloat(rule.maxBalance);
                if (newBalance > max) {
                    newBalance = max;
                }
            }

            // 4. Insert ledger entry
            await tx.insert(leaveLedger).values({
                employeeId,
                leaveTypeId: rule.leaveTypeId,
                entryType: 'ACCRUAL',
                amount: amount.toString(),
                balance: newBalance.toString(),
                accrualKey,
            });

            return true;
        });
    }
}

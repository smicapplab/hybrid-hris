import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { payrollBatches, payslips, payslipItems, employees, thirteenthMonthLedger } from '@hybrid-hris/db';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { CreatePayrollBatchDto } from './dto/create-payroll-batch.dto';
import { PayslipsService } from '../payslips/payslips.service';

@Injectable()
export class BatchesService {
    constructor(
        private readonly db: DatabaseService,
        private readonly payslipsService: PayslipsService,
    ) {}

    async findAll() {
        return this.db.db.select().from(payrollBatches).orderBy(desc(payrollBatches.createdAt));
    }

    async findOne(id: string) {
        const [batch] = await this.db.db.select().from(payrollBatches).where(eq(payrollBatches.id, id));
        if (!batch) throw new BadRequestException('Payroll batch not found');

        const batchPayslips = await this.db.db
            .select({
                id: payslips.id,
                employeeId: payslips.employeeId,
                employeeNo: employees.employeeNo,
                firstName: employees.firstName,
                lastName: employees.lastName,
                grossPay: payslips.grossPay,
                totalDeductions: payslips.totalDeductions,
                netPay: payslips.netPay,
                createdAt: payslips.createdAt,
            })
            .from(payslips)
            .innerJoin(employees, eq(payslips.employeeId, employees.id))
            .where(eq(payslips.batchId, id));

        return {
            ...batch,
            payslips: batchPayslips,
        };
    }

    async getPayslipDetail(payslipId: string) {
        const [payslip] = await this.db.db
            .select({
                id: payslips.id,
                employeeId: payslips.employeeId,
                employeeNo: employees.employeeNo,
                firstName: employees.firstName,
                lastName: employees.lastName,
                grossPay: payslips.grossPay,
                totalDeductions: payslips.totalDeductions,
                netPay: payslips.netPay,
                remarks: payslips.remarks,
                batchId: payslips.batchId,
                batchName: payrollBatches.name,
                startDate: payrollBatches.startDate,
                endDate: payrollBatches.endDate,
            })
            .from(payslips)
            .innerJoin(employees, eq(payslips.employeeId, employees.id))
            .innerJoin(payrollBatches, eq(payslips.batchId, payrollBatches.id))
            .where(eq(payslips.id, payslipId));

        if (!payslip) throw new NotFoundException('Payslip not found');

        const items = await this.db.db
            .select()
            .from(payslipItems)
            .where(eq(payslipItems.payslipId, payslipId));

        return {
            ...payslip,
            items,
        };
    }

    async create(dto: CreatePayrollBatchDto) {
        const [batch] = await this.db.db.insert(payrollBatches).values({
            ...dto,
            status: 'DRAFT',
        }).returning();
        return batch;
    }

    async processBatch(batchId: string) {
        const batch = await this.findOne(batchId);
        if (batch.status !== 'DRAFT') {
            throw new BadRequestException('Only draft batches can be processed');
        }

        // 1. Mark as processing
        await this.db.db.update(payrollBatches).set({ status: 'PROCESSING' }).where(eq(payrollBatches.id, batchId));

        try {
            // 2. Get all active employees
            // In a real system, we'd filter by active status and org unit if needed
            const allEmployees = await this.db.db.select({ id: employees.id }).from(employees).where(isNull(employees.deletedAt));

            let batchTotal = 0;

            await this.db.withTransaction(async (tx) => {
                for (const emp of allEmployees) {
                    const result = await this.payslipsService.calculateEmployeePayslip(emp.id, batch.startDate, batch.endDate);
                    if (!result) continue;

                    // 3. Save Payslip
                    const [savedPayslip] = await tx.insert(payslips).values({
                        batchId: batch.id,
                        employeeId: emp.id,
                        grossPay: result.grossPay,
                        totalDeductions: result.totalDeductions,
                        netPay: result.netPay,
                    }).returning();

                    // 4. Save Payslip Items
                    if (result.items.length > 0) {
                        const itemsToInsert = result.items.map(item => ({
                            payslipId: savedPayslip.id,
                            code: item.code,
                            name: item.name,
                            type: item.type as any, // Cast to any to handle EMPLOYER_COST
                            amount: item.amount,
                            description: item.description,
                        }));
                        await tx.insert(payslipItems).values(itemsToInsert);
                    }

                    // 5. 13th Month Accrual (1/12 of BASIC)
                    const basicItem = result.items.find(i => i.code === 'BASIC');
                    if (basicItem) {
                        const accrualAmt = Number(basicItem.amount) / 12;
                        const batchDate = new Date(batch.startDate);
                        await tx.insert(thirteenthMonthLedger).values({
                            employeeId: emp.id,
                            payslipId: savedPayslip.id,
                            year: batchDate.getFullYear().toString(),
                            month: (batchDate.getMonth() + 1).toString().padStart(2, '0'),
                            accrualAmount: accrualAmt.toFixed(2),
                        });
                    }

                    batchTotal += Number(result.netPay);
                }

                // 6. Finalize Batch
                await tx.update(payrollBatches).set({
                    status: 'COMPLETED',
                    totalAmount: batchTotal.toFixed(2),
                    processedAt: new Date(),
                    updatedAt: new Date(),
                }).where(eq(payrollBatches.id, batchId));
            });

            return { success: true, totalAmount: batchTotal };
        } catch (error: any) {
            console.error('Payroll Batch Processing Failed:', error);
            await this.db.db.update(payrollBatches).set({ status: 'VOID' }).where(eq(payrollBatches.id, batchId));
            throw new BadRequestException(`Processing failed: ${error?.message || 'Unknown error'}`);
        }
    }
}

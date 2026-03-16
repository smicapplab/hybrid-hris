export type PayrollBatchStatus = 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'VOID';

export interface PayrollBatch {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: PayrollBatchStatus;
    totalAmount: string;
    processedAt: string | null;
    createdAt: string;
    updatedAt: string;
    payslips?: (Payslip & {
        firstName: string;
        lastName: string;
        employeeNo: string;
    })[];
}

export interface Payslip {
    id: string;
    batchId: string;
    employeeId: string;
    grossPay: string;
    netPay: string;
    totalDeductions: string;
    remarks: string | null;
    createdAt: string;
}

export interface PayslipItem {
    id: string;
    payslipId: string;
    code: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_COST';
    amount: string;
    description: string | null;
}

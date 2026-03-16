'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Receipt, Wallet, Printer, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import type { PayslipItem } from '@/types/payroll.types'

type DetailedPayslip = {
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    grossPay: string;
    totalDeductions: string;
    netPay: string;
    batchName: string;
    startDate: string;
    endDate: string;
    items: PayslipItem[];
}

interface PayslipDetailsSheetProps {
    payslipId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PayslipDetailsSheet({ payslipId, open, onOpenChange }: PayslipDetailsSheetProps) {
    const { toast } = useToast()
    const [payslipDetail, setPayslipDetail] = useState<DetailedPayslip | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    const fetchPayslipDetail = useCallback(async (id: string) => {
        setLoadingDetail(true)
        try {
            const data = await apiFetch<DetailedPayslip>(`/payroll-batches/payslips/${id}`)
            setPayslipDetail(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load payslip details", variant: "destructive" })
        } finally {
            setLoadingDetail(false)
        }
    }, [toast])

    useEffect(() => {
        if (open && payslipId) {
            fetchPayslipDetail(payslipId)
        } else {
            setPayslipDetail(null)
        }
    }, [open, payslipId, fetchPayslipDetail])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-indigo-600" />
                        Payslip Details
                    </SheetTitle>
                    <SheetDescription className="font-medium text-slate-500">
                        {payslipDetail ? (
                             `Pay period ${format(new Date(payslipDetail.startDate), 'MMM dd')} - ${format(new Date(payslipDetail.endDate), 'MMM dd, yyyy')}`
                        ) : 'Loading...'}
                    </SheetDescription>
                </SheetHeader>

                {loadingDetail ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 animate-pulse font-medium italic">
                        Retrieving details...
                    </div>
                ) : payslipDetail && (
                    <div className="space-y-8">
                        {/* Net Pay Highlight */}
                        <div className="p-5 m-2 rounded-2xl bg-slate-900 text-white shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-[0.2em] mb-2">Net Take Home Pay</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">₱{Number(payslipDetail.netPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Peso</span>
                                </div>
                            </div>
                        </div>

                        {/* Earnings Section */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                <Wallet className="w-3 h-3" />
                                Earnings & Potentials
                            </h4>
                            <div className="space-y-2">
                                {payslipDetail.items.filter(i => i.type === 'EARNING').map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700 text-xs">{item.name}</span>
                                            {item.description && <span className="text-[10px] text-slate-400">{item.description}</span>}
                                        </div>
                                        <span className="font-mono text-xs font-semibold text-slate-600 italic">
                                            ₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between pt-4 px-2">
                                    <span className="font-bold text-slate-900 text-sm">TOTAL GROSS</span>
                                    <span className="font-mono font-bold text-slate-900 text-sm">₱{Number(payslipDetail.grossPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions Section */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 w-fit px-3 py-1 rounded-full">
                                <Receipt className="w-3 h-3" />
                                Deductions & Statutory
                            </h4>
                            <div className="space-y-2">
                                {payslipDetail.items.filter(i => i.type === 'DEDUCTION').map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                                        <span className="font-semibold text-slate-700 text-xs">{item.name}</span>
                                        <span className="font-mono text-xs font-semibold text-rose-500 italic">
                                            -₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between pt-4 px-2">
                                    <span className="font-bold text-slate-900 text-sm">TOTAL DEDUCTIONS</span>
                                    <span className="font-mono font-bold text-rose-500 text-sm">₱{Number(payslipDetail.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Company Contrib Section */}
                        <div className="space-y-4 opacity-70 group hover:opacity-100 transition-opacity pb-10">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-3 py-1 rounded-full group-hover:text-slate-600 transition-colors">
                                <Building2 className="w-3 h-3" />
                                Company Contributions (Non-Deductible)
                            </h4>
                            <div className="space-y-2">
                                {payslipDetail.items.filter(i => i.type === 'EMPLOYER_COST').map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 px-2 rounded-lg">
                                        <span className="font-medium text-slate-500 text-xs">{item.name}</span>
                                        <span className="font-mono text-xs text-slate-500 italic">
                                            ₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end p-4 border-t border-slate-100 gap-3">
                            <Button variant="outline" size="sm" className="font-bold border-slate-200" onClick={() => window.print()}>
                                <Printer className="w-3.5 h-3.5 mr-2" />
                                Print PDF
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

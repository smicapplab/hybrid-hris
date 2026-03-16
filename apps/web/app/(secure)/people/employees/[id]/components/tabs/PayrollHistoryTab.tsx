'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { FileText, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { SectionHeading } from '../../../helpers'
import { PayslipDetailsSheet } from '../../../../../me/payslips/components/payslip-details-sheet'

interface PayrollHistoryTabProps {
    employeeId: string;
}

interface PayslipHistoryItem {
    id: string;
    grossPay: string;
    totalDeductions: string;
    netPay: string;
    createdAt: string;
    batch: {
        name: string;
        startDate: string;
        endDate: string;
    };
}

export function PayrollHistoryTab({ employeeId }: PayrollHistoryTabProps) {
    const [payslips, setPayslips] = useState<PayslipHistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchHistory() {
            try {
                // Fetching via a specialized admin endpoint or filtering
                const data = await apiFetch<PayslipHistoryItem[]>(`/payroll-batches/payslips/employee/${employeeId}`)
                setPayslips(data)
            } catch (err) {
                console.error('Failed to fetch payroll history', err)
            } finally {
                setLoading(false)
            }
        }
        if (employeeId) fetchHistory()
    }, [employeeId])

    if (loading) return <div className="py-10 text-center text-sm text-muted-foreground font-medium italic">Loading history...</div>

    return (
        <Card className="shadow-sm border-muted/60">
            <CardContent className="pt-8 space-y-6">
                <SectionHeading>Payroll History</SectionHeading>

                {payslips.length > 0 ? (
                    <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10">
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest">Pay Period</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-right">Gross</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-right">Deductions</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-right">Net Pay</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payslips.map((p) => (
                                    <TableRow key={p.id} className="group hover:bg-slate-50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900">{p.batch.name}</span>
                                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                                                    {format(new Date(p.batch.startDate), 'MMM d')} - {format(new Date(p.batch.endDate), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs font-medium text-slate-600">
                                            ₱{Number(p.grossPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs font-medium text-red-600/70">
                                            ₱{Number(p.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm font-bold text-slate-900">
                                            ₱{Number(p.netPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all font-semibold"
                                                onClick={() => setSelectedPayslipId(p.id)}
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <FileText size={24} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">No payslips found</p>
                            <p className="text-xs text-slate-500 max-w-[240px] font-medium italic">This employee has not been included in any processed payroll batches yet.</p>
                        </div>
                    </div>
                )}
            </CardContent>

            {selectedPayslipId && (
                <PayslipDetailsSheet
                    payslipId={selectedPayslipId}
                    open={!!selectedPayslipId}
                    onOpenChange={(open: boolean) => !open && setSelectedPayslipId(null)}
                />
            )}
        </Card>
    )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Receipt, ArrowRight, Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { PayslipDetailsSheet } from './components/payslip-details-sheet'

type MyPayslipSummary = {
    id: string;
    grossPay: string;
    netPay: string;
    totalDeductions: string;
    createdAt: string;
    batchName: string;
    startDate: string;
    endDate: string;
}

export default function MyPayslipsPage() {
    const { toast } = useToast()
    const [payslips, setPayslips] = useState<MyPayslipSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null)

    const fetchPayslips = useCallback(async () => {
        try {
            const data = await apiFetch<MyPayslipSummary[]>('/profile/me/payslips')
            setPayslips(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load your payslips", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchPayslips()
    }, [fetchPayslips])

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">My Payslips</h1>
                <p className="text-sm text-slate-500 font-medium">View and download your salary history.</p>
            </div>

            <Card className="shadow-sm border-slate-200/60 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        Pay History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/20">
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Pay Period</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Batch</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400 text-right">Net Take Home</TableHead>
                                <TableHead className="w-20"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">Retrieving records...</TableCell></TableRow>
                            ) : payslips.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <Receipt className="w-10 h-10" />
                                            <span className="font-medium italic">No payslips found yet.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : payslips.map(p => (
                                <TableRow key={p.id} className="group hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => setSelectedPayslipId(p.id)}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700">{format(new Date(p.startDate), 'MMM dd')} - {format(new Date(p.endDate), 'MMM dd, yyyy')}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Cutoff Period</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">{p.batchName}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-mono text-xs font-bold text-indigo-600">₱{Number(p.netPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-start gap-3">
                <Lock className="w-5 h-5 text-indigo-400 mt-0.5" />
                <p className="text-xs text-indigo-600 leading-relaxed font-medium">
                    Only you and authorized HR administrators have access to these documents. Ensure you are in a private environment before printing or viewing detailed breakdowns.
                </p>
            </div>

            <PayslipDetailsSheet
                payslipId={selectedPayslipId}
                open={!!selectedPayslipId}
                onOpenChange={(open: boolean) => !open && setSelectedPayslipId(null)}
            />
        </div>
    )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ChevronLeft, Search, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import type { PayrollBatch } from '@/types/payroll.types'
import { PayslipDetailsSheet } from '../../../me/payslips/components/payslip-details-sheet'

export default function BatchDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { toast } = useToast()
    const [batch, setBatch] = useState<PayrollBatch | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null)

    const fetchBatch = useCallback(async () => {
        try {
            const data = await apiFetch<PayrollBatch>(`/payroll-batches/${id}`)
            setBatch(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load batch details", variant: "destructive" })
            router.push('/admin/payroll-batches')
        } finally {
            setLoading(false)
        }
    }, [id, router, toast])

    useEffect(() => {
        if (id) fetchBatch()
    }, [id, fetchBatch])

    if (loading) return <div className="p-6 text-sm text-muted-foreground italic animate-pulse">Loading batch...</div>
    if (!batch) return null

    const filteredPayslips = batch.payslips?.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employeeNo.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const stats = {
        totalGross: batch.payslips?.reduce((acc, p) => acc + Number(p.grossPay), 0) || 0,
        totalDeductions: batch.payslips?.reduce((acc, p) => acc + Number(p.totalDeductions), 0) || 0,
        totalNet: Number(batch.totalAmount || 0)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-4">
                <Link href="/admin/payroll-batches" className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors w-fit font-medium">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Batches
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">{batch.name}</h1>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                            {format(new Date(batch.startDate), 'PPP')} — {format(new Date(batch.endDate), 'PPP')}
                        </p>
                    </div>
                    <Badge variant="default" className="px-3 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border-emerald-200 uppercase tracking-widest">
                        {batch.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-slate-50/50 border-l-4 border-l-indigo-500">
                    <CardContent className="pt-6">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Gross Pay</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-1">₱{stats.totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-slate-50/50 border-l-4 border-l-rose-500">
                    <CardContent className="pt-6">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Deductions</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-1">₱{stats.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-indigo-50/30 border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Net Pay</p>
                        <h3 className="text-xl font-bold text-emerald-600 mt-1">₱{stats.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-slate-200/60">
                <CardHeader className="border-b bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">Payroll Register</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search employee..."
                                className="pl-9 h-9 text-sm border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-slate-400">Employee</TableHead>
                                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 text-right">Gross Pay</TableHead>
                                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 text-right">Deductions</TableHead>
                                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 text-right">Net Pay</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayslips.map(p => (
                                <TableRow key={p.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedPayslipId(p.id)}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                                {p.firstName[0]}{p.lastName[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-700 text-xs">{p.firstName} {p.lastName}</span>
                                                <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{p.employeeNo}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-600 italic">
                                        ₱{Number(p.grossPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-semibold text-rose-500 italic">
                                        -₱{Number(p.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                                        ₱{Number(p.netPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PayslipDetailsSheet
                payslipId={selectedPayslipId}
                open={!!selectedPayslipId}
                onOpenChange={(open: boolean) => !open && setSelectedPayslipId(null)}
            />
        </div>
    )
}

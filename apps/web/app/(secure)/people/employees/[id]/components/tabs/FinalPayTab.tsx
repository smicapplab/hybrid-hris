'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Employee } from '@/types/employee.type'
import type { FinalPayCalculation } from '@/types/payroll.types'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { SectionHeading } from '../../../helpers'
import { Calculator, AlertCircle, CheckCircle2, Download } from 'lucide-react'

interface FinalPayTabProps {
    employee: Employee;
}

export function FinalPayTab({ employee }: FinalPayTabProps) {
    const { toast } = useToast()
    const [calculation, setCalculation] = useState<FinalPayCalculation | null>(null)
    const [loading, setLoading] = useState(false)

    const handleCalculate = async () => {
        setLoading(true)
        try {
            const data = await apiFetch<FinalPayCalculation>(`/payroll/final-pay/${employee.id}/calculate`)
            setCalculation(data)
            toast({ title: 'Calculation Complete', description: 'Final pay settlement has been generated.' })
        } catch (err) {
            console.error('Failed to calculate final pay', err)
            toast({ title: 'Error', description: 'Failed to calculate final pay settlement.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-muted/60">
                <CardContent className="pt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <SectionHeading>Final Pay Settlement</SectionHeading>
                        <Button
                            onClick={handleCalculate}
                            disabled={loading || employee.status === 'ACTIVE'}
                            className="font-bold gap-2"
                        >
                            <Calculator size={16} />
                            {loading ? 'Calculating...' : 'Run Settlement Calculation'}
                        </Button>
                    </div>

                    {employee.status === 'ACTIVE' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold">Employee is still Active</p>
                                <p className="opacity-90">Settlement calculations are typically performed for employees who have resigned or been terminated. You can still run a preview calculation, but actual settlement occurs during offboarding.</p>
                            </div>
                        </div>
                    )}

                    {!calculation && !loading && (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                            <Calculator size={48} className="opacity-10 mb-4" />
                            <p className="text-sm font-medium italic">Click the button above to generate the final pay breakdown.</p>
                        </div>
                    )}

                    {calculation && (
                        <div className="space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-slate-50 border-slate-200 shadow-none">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Monthly Basic</p>
                                        <p className="text-xl font-bold text-slate-900">₱{Number(calculation.monthlyBasic).toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-none">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Daily Rate (Factor {employee.profile?.factorRate || '261'})</p>
                                        <p className="text-xl font-bold text-slate-900">₱{Number(calculation.dailyRate).toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-indigo-600 border-indigo-500 shadow-md">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-100 mb-1">Total Net Settlement</p>
                                        <p className="text-2xl font-black text-white">₱{Number(calculation.totalFinalPay).toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Breakdown Table */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    Settlement Breakdown
                                </h3>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                <TableHead className="w-[100px] font-bold text-[11px] uppercase text-slate-400">Code</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase text-slate-400">Item Description</TableHead>
                                                <TableHead className="text-center font-bold text-[11px] uppercase text-slate-400">Units / Balance</TableHead>
                                                <TableHead className="text-right font-bold text-[11px] uppercase text-slate-400">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {calculation.items.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell><span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.code}</span></TableCell>
                                                    <TableCell className="font-medium text-slate-700">{item.name}</TableCell>
                                                    <TableCell className="text-center tabular-nums font-semibold text-slate-600">{item.units || '-'}</TableCell>
                                                    <TableCell className="text-right tabular-nums font-bold text-slate-900">₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                                <TableCell colSpan={3} className="text-right font-bold text-slate-900 tracking-tight uppercase text-xs">Gross Settlement Amount</TableCell>
                                                <TableCell className="text-right tabular-nums font-black text-slate-900 text-lg">₱{Number(calculation.totalFinalPay).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button variant="outline" size="sm" className="font-bold gap-2 border-slate-200">
                                    <Download size={16} />
                                    Export Settlement Report
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

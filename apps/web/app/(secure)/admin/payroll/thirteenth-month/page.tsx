'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { RefreshCw, User, Building, Calculator, Download, Calendar } from 'lucide-react'
import { SectionHeading } from '../../../people/employees/helpers'

interface ThirteenthMonthSummary {
    employeeId: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    orgUnitName: string;
    positionTitle: string;
    totalAccrued: string;
}

export default function ThirteenthMonthPage() {
    const { toast } = useToast()
    const [summary, setSummary] = useState<ThirteenthMonthSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState(new Date().getFullYear().toString())

    const fetchSummary = useCallback(async () => {
        setLoading(true)
        try {
            const data = await apiFetch<ThirteenthMonthSummary[]>(`/payroll/thirteenth-month/summary?year=${year}`)
            setSummary(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load 13th month summary", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [year, toast])

    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    const totalOrgAccrual = summary.reduce((acc, curr) => acc + Number(curr.totalAccrued || 0), 0)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">13th Month Management</h1>
                    <p className="text-sm text-slate-500 font-medium">Monitor annual 13th-month accruals across the organization.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {['2025', '2026'].map(y => (
                            <button
                                key={y}
                                onClick={() => setYear(y)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                    year === y 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchSummary} className="font-bold border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Calculator size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Total Organization Accrual</p>
                            <p className="text-2xl font-black text-slate-900">₱{totalOrgAccrual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Eligible Employees</p>
                            <p className="text-2xl font-black text-slate-900">{summary.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-600 border-indigo-500 shadow-md">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-100 mb-0.5">Target Payout Date</p>
                            <p className="text-2xl font-black text-white italic opacity-90 leading-tight">Dec 15, {year}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-slate-200/60 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accrual Ledger: {year}</h2>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        <Download size={14} className="mr-2" />
                        Export Ledger
                    </Button>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30">
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Employee</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Organization Unit</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Position</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400 text-right">Total Accrued (YTD)</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400 text-right">Projected 13th Month</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <RefreshCw className="w-8 h-8 text-slate-200 animate-spin mx-auto mb-2" />
                                        <p className="text-sm font-medium text-slate-400 italic">Calculating organization-wide accruals...</p>
                                    </TableCell>
                                </TableRow>
                            ) : summary.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic">
                                        No 13th month accruals found for {year}.
                                    </TableCell>
                                </TableRow>
                            ) : summary.map(emp => (
                                <TableRow key={emp.employeeId} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-sm">{emp.firstName} {emp.lastName}</span>
                                            <span className="text-[10px] font-mono text-slate-400 leading-none mt-0.5">{emp.employeeNo}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-xs text-slate-600 font-medium">
                                            <Building size={12} className="mr-1.5 opacity-40" />
                                            {emp.orgUnitName || 'Unassigned'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 font-medium">
                                        {emp.positionTitle || 'Unassigned'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-mono font-bold text-slate-700">
                                            ₱{Number(emp.totalAccrued || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="font-black text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100 uppercase tracking-tighter">
                                            ₱{(Number(emp.totalAccrued || 0) * (12/Number(new Date().getMonth()+1))).toLocaleString('en-US', { maximumFractionDigits: 0 })}*
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="p-3 border-t border-slate-100 bg-slate-50/80">
                    <p className="text-[10px] text-slate-400 italic">
                        * Projected 13th month is an estimate based on linear extrapolation of current YTD accruals. Actual payout may vary.
                    </p>
                </div>
            </Card>
        </div>
    )
}

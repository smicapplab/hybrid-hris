'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { PendingAdjustmentItem } from '@/types/attendance.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, ClipboardList, Calendar, Clock } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export default function AttendanceApprovalsPage() {
    const { toast } = useToast()
    const [items, setItems] = useState<PendingAdjustmentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiFetch<PendingAdjustmentItem[]>('/attendance-adjustments/pending')
            setItems(data ?? [])
        } catch (error) {
            console.error('Failed to load pending adjustments:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setActionLoading(id)
        try {
            await apiFetch(`/attendance-adjustments/${id}/${action}`, {
                method: 'PATCH',
                body: JSON.stringify({ remarks: `Processed by manager` })
            })
            toast({ title: `Adjustment ${action}d`, variant: 'success' })
            loadData()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Action failed';
            toast({ title: 'Action failed', description: message, variant: 'destructive' })
        } finally {
            setActionLoading(null)
        }
    }

    const formatTS = (iso: string | null) => {
        if (!iso) return <span className="text-gray-300">MISSING</span>
        return format(new Date(iso), 'hh:mm a')
    }

    const formatFullDate = (iso: string | null) => {
        if (!iso) return null
        return format(new Date(iso), 'MMM dd, yyyy')
    }

    return (
        <div className="p-6 space-y-6 text-gray-800">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-blue-900">Attendance Approvals</h1>
                <p className="text-muted-foreground">Review team time-correction and missing entry requests.</p>
            </div>

            <Card className="shadow-sm border-blue-50">
                <CardHeader className="bg-blue-50/20 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                        Pending Adjustments Queue
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="pl-6">Employee</TableHead>
                                <TableHead>Work Date</TableHead>
                                <TableHead>Original (In/Out)</TableHead>
                                <TableHead>Requested (In/Out)</TableHead>
                                <TableHead>Reason/Remarks</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                        Loading queue...
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No pending attendance adjustments.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.adjustment.id} className="hover:bg-blue-50/30 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="font-semibold text-blue-900">{item.employee.firstName} {item.employee.lastName}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{item.employee.employeeNo}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-medium text-sm">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                                {format(new Date(item.adjustment.workDate), 'MMM dd, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[11px] font-medium text-zinc-400 space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" /> IN: {formatTS(item.adjustment.previousActualInAt)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" /> OUT: {formatTS(item.adjustment.previousActualOutAt)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[11px] font-bold text-blue-700 space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" /> IN: {formatTS(item.adjustment.requestedActualInAt)}
                                                    <span className="text-[9px] text-zinc-400 font-normal ml-1">
                                                        ({formatFullDate(item.adjustment.requestedActualInAt)})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" /> OUT: {formatTS(item.adjustment.requestedActualOutAt)}
                                                    <span className="text-[9px] text-zinc-400 font-normal ml-1">
                                                        ({formatFullDate(item.adjustment.requestedActualOutAt)})
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-zinc-600 italic line-clamp-2 max-w-62.5">
                                                &quot;{item.adjustment.remarks}&quot;
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                    onClick={() => handleAction(item.adjustment.id, 'reject')}
                                                    disabled={!!actionLoading}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-white font-bold"
                                                    onClick={() => handleAction(item.adjustment.id, 'approve')}
                                                    disabled={!!actionLoading}
                                                >
                                                    {actionLoading === item.adjustment.id ? (
                                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    Approve
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

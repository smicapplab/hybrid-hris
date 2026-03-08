'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Clock, History, Lock, MoreHorizontal, Plus, Edit3, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { AttendanceLog } from '@/types/attendance.types'
import { AttendanceAdjustmentDialog } from '../../dashboard/components/attendance-adjustment-dialog'
import { useToast } from '@/hooks/use-toast'

/* ─── Helpers ────────────────────────────────────────────────── */

function formatTime(ts: string | null | undefined): string | null {
    if (!ts) return null
    try {
        return format(new Date(ts), 'h:mm a')
    } catch (e) {
        return null
    }
}

function formatDuration(inAt: string | null | undefined, outAt: string | null | undefined): string | null {
    if (!inAt || !outAt) return null
    try {
        const mins = differenceInMinutes(new Date(outAt), new Date(inAt))
        if (mins <= 0) return null
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return m === 0 ? `${h}h` : `${h}h ${m}m`
    } catch (e) {
        return null
    }
}

const SOURCE_BADGE: Record<string, string> = {
    WEB: 'bg-blue-50 text-blue-600 border-blue-200',
    MOBILE: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    KIOSK: 'bg-violet-50 text-violet-600 border-violet-200',
    API: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

function SourceTag({ source }: { source: string | null }) {
    if (!source) return null
    return (
        <span className={cn(
            'text-[10px] border rounded-full px-1.5 py-px font-medium shrink-0',
            SOURCE_BADGE[source] || 'bg-zinc-100 text-zinc-500 border-zinc-200',
        )}>
            {source}
        </span>
    )
}

function TimeCell({ 
    ts, 
    source, 
    pendingTs 
}: { 
    ts: string | null; 
    source: string | null;
    pendingTs?: string | null;
}) {
    const label = formatTime(ts)
    const pendingLabel = formatTime(pendingTs)

    return (
        <div className="flex flex-col gap-0.5">
            {label ? (
                <div className="flex items-center gap-1.5">
                    <span className={cn(
                        "text-sm font-medium tabular-nums",
                        pendingLabel && "line-through text-muted-foreground/60"
                    )}>
                        {label}
                    </span>
                    {!pendingLabel && <SourceTag source={source} />}
                </div>
            ) : !pendingLabel ? (
                <span className="text-muted-foreground text-sm">—</span>
            ) : null}

            {pendingLabel && (
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold tabular-nums text-amber-600">
                        {pendingLabel}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-50 px-1 rounded border border-amber-100">
                        Pending
                    </span>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ row }: { row: AttendanceLog }) {
    if (row.pendingAdjustmentId) {
        return (
            <div className="flex flex-col gap-1">
                <span className="text-[10px] border rounded-full px-2 py-0.5 font-bold bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-tight text-center">
                    Adjustment Pending
                </span>
            </div>
        )
    }
    if (row.actualInAt && row.actualOutAt) {
        return (
            <span className="text-xs border rounded-full px-2 py-0.5 font-medium bg-green-50 text-green-700 border-green-200">
                Complete
            </span>
        )
    }
    if (row.actualInAt && !row.actualOutAt) {
        return (
            <span className="text-xs border rounded-full px-2 py-0.5 font-medium bg-amber-50 text-amber-700 border-amber-200">
                No Time-Out
            </span>
        )
    }
    return (
        <span className="text-xs border rounded-full px-2 py-0.5 font-medium bg-zinc-100 text-zinc-500 border-zinc-200">
            Missing
        </span>
    )
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AttendanceHistoryPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [records, setRecords] = useState<AttendanceLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Adjustment Dialog State
    const [isAdjustOpen, setIsAdjustOpen] = useState(false)
    const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiFetch<AttendanceLog[]>('/profile/me/attendance-history')
            setRecords(data ?? [])
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load attendance history')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!user) return
        loadLogs()
    }, [user, loadLogs])

    const handleRequestAdjustment = (log?: AttendanceLog) => {
        setSelectedLog(log || null)
        setIsAdjustOpen(true)
    }

    const handleCancelAdjustment = async (adjustmentId: string) => {
        if (!confirm('Are you sure you want to cancel this adjustment request?')) return

        try {
            await apiFetch(`/attendance-adjustments/${adjustmentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'CANCELLED' })
            })
            toast({ title: 'Request Cancelled', description: 'The adjustment request has been cancelled.', variant: 'success' })
            loadLogs()
        } catch (err: any) {
            toast({ title: 'Cancel failed', description: err.message, variant: 'destructive' })
        }
    }

    if (!user) return null

    if (loading && records.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                Loading attendance history…
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-900">Attendance History</h1>
                    <p className="text-muted-foreground text-sm">View your past time logs and request corrections.</p>
                </div>
                <Button onClick={() => handleRequestAdjustment()} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100">
                    <Plus className="w-4 h-4" /> File Missing Entry
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm border border-destructive/20">
                    {error}
                </div>
            )}

            <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-3 bg-blue-50/20 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-600" />
                        Last 30 Days
                        {records.length > 0 && (
                            <span className="ml-auto text-[10px] uppercase font-bold text-muted-foreground">
                                {records.length} record{records.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    {records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Clock className="w-10 h-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground font-medium">
                                No attendance records found.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Scheduled</TableHead>
                                    <TableHead>Time In</TableHead>
                                    <TableHead>Time Out</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map(row => {
                                    // Use raw shift times if available (prevents timezone offset issues)
                                    const scheduledLabel = row.startTime && row.endTime
                                        ? `${format(parseISO(`2000-01-01T${row.startTime}`), 'h:mm a')} – ${format(parseISO(`2000-01-01T${row.endTime}`), 'h:mm a')}`
                                        : (row.scheduledInAt && row.scheduledOutAt
                                            ? `${formatTime(row.scheduledInAt)} – ${formatTime(row.scheduledOutAt)}`
                                            : '—');

                                    const duration = formatDuration(row.actualInAt, row.actualOutAt)
                                    const pendingDuration = formatDuration(row.pendingActualInAt ?? null, row.pendingActualOutAt ?? null)

                                    return (
                                        <TableRow key={row.workDate} className={cn(
                                            "hover:bg-blue-50/30 transition-colors",
                                            row.pendingAdjustmentId && "bg-amber-50/20"
                                        )}>
                                            {/* Date */}
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    {row.isLocked && (
                                                        <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm leading-tight text-blue-900">
                                                            {format(parseISO(row.workDate), 'EEE, MMM d')}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">
                                                            {format(parseISO(row.workDate), 'yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Scheduled */}
                                            <TableCell className="text-xs text-muted-foreground tabular-nums">
                                                {scheduledLabel}
                                            </TableCell>

                                            {/* Actual In */}
                                            <TableCell>
                                                <TimeCell 
                                                    ts={row.actualInAt} 
                                                    source={row.sourceIn} 
                                                    pendingTs={row.pendingActualInAt}
                                                />
                                            </TableCell>

                                            {/* Actual Out */}
                                            <TableCell>
                                                <TimeCell 
                                                    ts={row.actualOutAt} 
                                                    source={row.sourceOut} 
                                                    pendingTs={row.pendingActualOutAt}
                                                />
                                            </TableCell>

                                            {/* Hours */}
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {duration ? (
                                                        <span className={cn(
                                                            "text-sm font-bold tabular-nums",
                                                            pendingDuration ? "line-through text-muted-foreground/60 font-medium" : "text-gray-700"
                                                        )}>
                                                            {duration}
                                                        </span>
                                                    ) : !pendingDuration ? (
                                                        <span className="text-muted-foreground">—</span>
                                                    ) : null}
                                                    {pendingDuration && (
                                                        <span className="text-sm font-bold tabular-nums text-amber-700">
                                                            {pendingDuration}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <StatusBadge row={row} />
                                                    {row.pendingRemarks && (
                                                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium max-w-[120px] truncate">
                                                            <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                                            <span>{row.pendingRemarks}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell>
                                                {!row.isLocked && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {row.pendingAdjustmentId ? (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleRequestAdjustment(row)} className="gap-2 cursor-pointer">
                                                                        <Edit3 className="w-3.5 h-3.5" /> Edit Request
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleCancelAdjustment(row.pendingAdjustmentId!)} 
                                                                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5" /> Cancel Request
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleRequestAdjustment(row)} className="gap-2 cursor-pointer">
                                                                    <Edit3 className="w-3.5 h-3.5" /> Request Correction
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AttendanceAdjustmentDialog
                open={isAdjustOpen}
                onOpenChange={setIsAdjustOpen}
                initialLog={selectedLog}
                onSuccess={loadLogs}
            />
        </div>
    )
}

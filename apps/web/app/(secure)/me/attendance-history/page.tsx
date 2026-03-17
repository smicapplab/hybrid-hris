'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { format, parseISO, differenceInMinutes, subDays } from 'date-fns'
import { AttendanceLog, PaginatedAttendanceLogs } from '@/types/attendance.types'
import { DateRangePickerField } from '@/components/ui/date-range-picker-field'
import { cn } from '@/lib/utils'
import { Clock, History, Lock, MoreHorizontal, Plus, Edit3, XCircle, AlertCircle, Timer, Umbrella, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { AttendanceAdjustmentDialog } from '../../dashboard/components/attendance-adjustment-dialog'
import { OvertimeRequestDialog } from '../../dashboard/components/overtime-request-dialog'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

/* ─── Helpers ────────────────────────────────────────────────── */

function formatTime(ts: string | null | undefined): string | null {
    if (!ts) return null
    try {
        return format(new Date(ts), 'h:mm a')
    } catch {
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
    } catch {
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
    
    const status = row.status || 'PRESENT'
    
    if (status === 'HOLIDAY') {
        return (
            <span className="text-xs border rounded-full px-2 py-0.5 font-medium bg-blue-50 text-blue-700 border-blue-200">
                Holiday
            </span>
        )
    }

    if (row.actualInAt && row.actualOutAt) {
        return (
            <span className={cn(
                "text-xs border rounded-full px-2 py-0.5 font-medium",
                status === 'PRESENT' ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
            )}>
                {status}
            </span>
        )
    }
    if (row.actualInAt && !row.actualOutAt) {
        return (
            <span className="text-xs border rounded-full px-2 py-0.5 font-medium bg-amber-50 text-amber-700 border-amber-200">
                In Progress
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
    const [total, setTotal] = useState(0)
    const totalPages = Math.ceil(total / 30)
    const [page, setPage] = useState(1)
    const [range, setRange] = useState<{ from: string, to: string }>({
        from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd')
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Adjustment Dialog State
    const [isAdjustOpen, setIsAdjustOpen] = useState(false)
    const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)
    const [adjustmentToCancel, setAdjustmentToCancel] = useState<string | null>(null)

    // OT Dialog State
    const [isOtOpen, setIsOtOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true)
            const query = new URLSearchParams({
                from: range.from,
                to: range.to,
                page: page.toString(),
                limit: '30'
            })
            const res = await apiFetch<PaginatedAttendanceLogs>(`/profile/me/attendance-history?${query.toString()}`)
            setRecords(res.data ?? [])
            setTotal(res.total ?? 0)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load attendance history';
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [page, range])

    useEffect(() => {
        if (!user) return
        loadLogs()
    }, [user, loadLogs])

    const handleRequestAdjustment = (log?: AttendanceLog) => {
        setSelectedLog(log || null)
        setIsAdjustOpen(true)
    }

    const handleFileOvertime = (date?: string) => {
        setSelectedDate(date || format(new Date(), 'yyyy-MM-dd'))
        setIsOtOpen(true)
    }

    const handleConfirmCancelAdjustment = async () => {
        if (!adjustmentToCancel) return

        try {
            await apiFetch(`/attendance-adjustments/${adjustmentToCancel}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'CANCELLED' })
            })
            toast({ title: 'Request Cancelled', description: 'The adjustment request has been cancelled.', variant: 'success' })
            setAdjustmentToCancel(null)
            loadLogs()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Cancel failed';
            toast({ title: 'Cancel failed', description: message, variant: 'destructive' })
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
        <div className="p-6 space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-900">Attendance History</h1>
                    <p className="text-muted-foreground text-sm">View your past time logs and request corrections.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleFileOvertime()} variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Timer className="w-4 h-4" /> File Overtime
                    </Button>
                    <Button onClick={() => handleRequestAdjustment()} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100">
                        <Plus className="w-4 h-4" /> File Missing Entry
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm border border-destructive/20">
                    {error}
                </div>
            )}

            <Card className="shadow-sm border-blue-50 overflow-hidden">
                <CardHeader className="pb-3 bg-blue-50/20 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-600" />
                        Attendance History
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="w-64">
                            <DateRangePickerField
                                label=""
                                startDate={range.from}
                                endDate={range.to}
                                onChangeAction={(start, end) => {
                                    setRange({ from: start, to: end })
                                    setPage(1)
                                }}
                                placeholder="Filter range"
                            />
                        </div>
                        <Badge variant="secondary" className="font-semibold text-[10px] whitespace-nowrap">
                            {total} RECORDS
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-0 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="text-xs font-medium text-blue-600 uppercase tracking-widest">Loading history...</span>
                            </div>
                        </div>
                    )}
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
                                    <TableHead>Time In/Out</TableHead>
                                    <TableHead className="text-center">Hours</TableHead>
                                    <TableHead className="text-center">OT</TableHead>
                                    <TableHead className="text-center">Holiday/ND</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-12.5"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map(row => {
                                    const duration = formatDuration(row.actualInAt, row.actualOutAt)
                                    const pendingDuration = formatDuration(row.pendingActualInAt ?? null, row.pendingActualOutAt ?? null)
                                    
                                    const otHours = parseFloat(row.overtimeHours || '0')
                                    const holidayHours = parseFloat(row.holidayHours || '0')
                                    const ndHours = parseFloat(row.nightDiffHours || '0')

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

                                            {/* Time In/Out */}
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <TimeCell
                                                        ts={row.actualInAt}
                                                        source={row.sourceIn}
                                                        pendingTs={row.pendingActualInAt}
                                                    />
                                                    <span className="text-muted-foreground/30 text-xs">→</span>
                                                    <TimeCell
                                                        ts={row.actualOutAt}
                                                        source={row.sourceOut}
                                                        pendingTs={row.pendingActualOutAt}
                                                    />
                                                </div>
                                            </TableCell>

                                            {/* Total Hours */}
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-0.5">
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

                                            {/* OT Hours */}
                                            <TableCell className="text-center">
                                                {otHours > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-bold text-orange-600 tabular-nums">
                                                            {otHours.toFixed(1)}h
                                                        </span>
                                                        <span className="text-[9px] uppercase font-bold text-orange-400">Approved</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>

                                            {/* Holiday / ND */}
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {holidayHours > 0 && (
                                                        <div className="flex items-center gap-1 text-blue-600">
                                                            <Umbrella className="w-3 h-3" />
                                                            <span className="text-xs font-bold">{holidayHours.toFixed(1)}h</span>
                                                        </div>
                                                    )}
                                                    {ndHours > 0 && (
                                                        <div className="flex items-center gap-1 text-indigo-600">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="text-xs font-bold">{ndHours.toFixed(1)}h</span>
                                                        </div>
                                                    )}
                                                    {holidayHours === 0 && ndHours === 0 && (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <StatusBadge row={row} />
                                                    {row.pendingRemarks && (
                                                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium max-w-30 truncate">
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
                                                                        <Edit3 className="w-3.5 h-3.5" /> Edit Correction
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setAdjustmentToCancel(row.pendingAdjustmentId!)}
                                                                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5" /> Cancel Correction
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleRequestAdjustment(row)} className="gap-2 cursor-pointer">
                                                                        <Edit3 className="w-3.5 h-3.5" /> Request Correction
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleFileOvertime(row.workDate)} className="gap-2 cursor-pointer text-orange-600 focus:text-orange-700">
                                                                        <Timer className="w-3.5 h-3.5" /> File Overtime
                                                                    </DropdownMenuItem>
                                                                </>
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
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t bg-blue-50/10 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-blue-200"
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-blue-200"
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages || loading}
                            >
                                <ChevronRight className="w-4 h-4 text-blue-600" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <AttendanceAdjustmentDialog
                open={isAdjustOpen}
                onOpenChangeAction={setIsAdjustOpen}
                initialLog={selectedLog}
                onSuccessAction={loadLogs}
            />

            <OvertimeRequestDialog
                open={isOtOpen}
                onOpenChangeAction={setIsOtOpen}
                initialDate={selectedDate}
                onSuccessAction={loadLogs}
            />

            <ConfirmDialog 
                open={!!adjustmentToCancel}
                onOpenChange={(o) => !o && setAdjustmentToCancel(null)}
                title="Cancel Adjustment Request"
                description="Are you sure you want to cancel this attendance adjustment request? This action cannot be undone."
                onConfirm={handleConfirmCancelAdjustment}
                variant="destructive"
                confirmText="Cancel Request"
            />
        </div>
    )
}

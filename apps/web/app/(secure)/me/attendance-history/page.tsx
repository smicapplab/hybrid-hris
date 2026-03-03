'use client'

import { useEffect, useState } from 'react'
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
import { Clock, History, Lock, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, differenceInMinutes } from 'date-fns'

/* ─── Types ─────────────────────────────────────────────────── */

type AttendanceSource = 'WEB' | 'MOBILE' | 'KIOSK' | 'API'

type AttendanceRecord = {
    id: string
    workDate: string
    scheduledInAt: string | null
    scheduledOutAt: string | null
    actualInAt: string | null
    actualOutAt: string | null
    sourceIn: AttendanceSource | null
    sourceOut: AttendanceSource | null
    isLocked: boolean
}

/* ─── Helpers ────────────────────────────────────────────────── */

function formatTime(ts: string | null): string | null {
    if (!ts) return null
    return format(new Date(ts), 'h:mm a')
}

function formatDuration(inAt: string | null, outAt: string | null): string | null {
    if (!inAt || !outAt) return null
    const mins = differenceInMinutes(new Date(outAt), new Date(inAt))
    if (mins <= 0) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const SOURCE_BADGE: Record<AttendanceSource, string> = {
    WEB: 'bg-blue-50 text-blue-600 border-blue-200',
    MOBILE: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    KIOSK: 'bg-violet-50 text-violet-600 border-violet-200',
    API: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

/* ─── Sub-components ─────────────────────────────────────────── */

function SourceTag({ source }: { source: AttendanceSource | null }) {
    if (!source) return null
    return (
        <span className={cn(
            'text-[10px] border rounded-full px-1.5 py-px font-medium shrink-0',
            SOURCE_BADGE[source],
        )}>
            {source}
        </span>
    )
}

function TimeCell({ ts, source }: { ts: string | null; source: AttendanceSource | null }) {
    const label = formatTime(ts)
    if (!label) return <span className="text-muted-foreground">—</span>
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium tabular-nums">{label}</span>
            <SourceTag source={source} />
        </div>
    )
}

function StatusBadge({ row }: { row: AttendanceRecord }) {
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
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        apiFetch<AttendanceRecord[]>('/profile/me/attendance-history')
            .then(setRecords)
            .catch(err => setError(err?.message ?? 'Failed to load attendance history'))
            .finally(() => setLoading(false))
    }, [user])

    if (!user) return null

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                Loading attendance history…
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-destructive">
                {error}
            </div>
        )
    }

    return (
        <div className="p-6 space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" />
                        Last 30 Days
                        {records.length > 0 && (
                            <span className="ml-auto text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
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
                                No attendance records in the last 30 days
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Scheduled</TableHead>
                                    <TableHead>Time In</TableHead>
                                    <TableHead>Time Out</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map(row => {
                                    const scheduledIn = formatTime(row.scheduledInAt)
                                    const scheduledOut = formatTime(row.scheduledOutAt)
                                    const duration = formatDuration(row.actualInAt, row.actualOutAt)

                                    return (
                                        <TableRow key={row.id}>
                                            {/* Date */}
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    {row.isLocked && (
                                                        <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm leading-tight">
                                                            {format(parseISO(row.workDate), 'EEE, MMM d')}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(parseISO(row.workDate), 'yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Scheduled */}
                                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                {scheduledIn && scheduledOut
                                                    ? `${scheduledIn} – ${scheduledOut}`
                                                    : '—'
                                                }
                                            </TableCell>

                                            {/* Actual In */}
                                            <TableCell>
                                                <TimeCell ts={row.actualInAt} source={row.sourceIn} />
                                            </TableCell>

                                            {/* Actual Out */}
                                            <TableCell>
                                                <TimeCell ts={row.actualOutAt} source={row.sourceOut} />
                                            </TableCell>

                                            {/* Hours */}
                                            <TableCell>
                                                {duration
                                                    ? <span className="text-sm font-medium tabular-nums">{duration}</span>
                                                    : <span className="text-muted-foreground">—</span>
                                                }
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <StatusBadge row={row} />
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

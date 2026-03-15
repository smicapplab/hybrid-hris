'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { WorkSchedule } from '@/types/work-schedule.type'
import { DAYS } from '@/lib/work-schedule.enum'
import { Badge } from '@/components/ui/badge'


function parseMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

function totalWorkMinutes(startTime: string, endTime: string, breakMinutes: number): number {
    const start = parseMinutes(startTime)
    const end = parseMinutes(endTime)
    const raw = end >= start ? end - start : end + 24 * 60 - start
    return Math.max(0, raw - breakMinutes)
}

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function formatTime(time: string): string {
    if (!time) return '-'
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function WorkSchedulePage() {
    const { user } = useAuth()
    const [schedule, setSchedule] = useState<WorkSchedule | null>(null)
    const [pendingShifts, setPendingShifts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user || !user.employeeId) return
        
        Promise.all([
            apiFetch<WorkSchedule | null>('/profile/me/work-schedule'),
            apiFetch<any[]>(`/pending-shift-assignments?employeeId=${user.employeeId}&status=PENDING`)
        ])
        .then(([sched, pending]) => {
            setSchedule(sched)
            setPendingShifts(pending)
        })
        .catch(err => setError(err?.message ?? 'Failed to load work schedule'))
        .finally(() => setLoading(false))
    }, [user])

    if (!user) return null

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                Loading work schedule…
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

    const totalMinutes = schedule ? totalWorkMinutes(schedule.startTime, schedule.endTime, schedule.breakMinutes) : 0
    const workDayCount = schedule ? DAYS.filter(d => schedule[d.key] as boolean).length : 0

    return (
        <div className="p-6 space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Work Schedule</h1>
                    <p className="text-sm text-muted-foreground font-medium">Your current and upcoming shift assignments.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* ── Active Shift info card ── */}
                    {!schedule ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                                <Calendar className="w-10 h-10 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground font-medium">No active work schedule assigned</p>
                                <p className="text-xs text-muted-foreground">Contact HR to get a shift assigned to your account.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card className="border-primary/10 shadow-sm overflow-hidden">
                                <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Active Schedule</span>
                                    <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">CURRENT</Badge>
                                </div>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <h2 className="text-xl font-extrabold leading-tight tracking-tight">{schedule.templateName}</h2>
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground mt-1.5 inline-block border">
                                                {schedule.templateCode}
                                            </code>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={cn(
                                                'text-[10px] border rounded-lg px-2.5 py-1 font-bold uppercase tracking-wider',
                                                schedule.isFlexible
                                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                                            )}>
                                                {schedule.isFlexible ? 'Flexible' : 'Fixed'}
                                            </span>
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                                                Since {format(parseISO(schedule.effectiveFrom), 'PPP')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-dashed">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">In</p>
                                            <p className="text-lg font-extrabold">{formatTime(schedule.startTime)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Out</p>
                                            <p className="text-lg font-extrabold">{formatTime(schedule.endTime)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Break</p>
                                            <p className="text-lg font-extrabold">{schedule.breakMinutes}m</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/30 p-3 rounded-xl border border-muted/50">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span>
                                            {formatDuration(totalMinutes)} per day ·{' '}
                                            {workDayCount} work day{workDayCount !== 1 ? 's' : ''} per week
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ── Weekly schedule table ── */}
                            <Card className="shadow-sm border-muted/60">
                                <CardHeader className="pb-3 border-b bg-muted/10">
                                    <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-bold">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        Weekly Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/5">
                                                    <th className="py-3 px-6 font-bold">Day</th>
                                                    <th className="py-3 px-4 font-bold">Status</th>
                                                    <th className="py-3 px-4 font-bold">Hours</th>
                                                    <th className="py-3 px-4 font-bold">Break</th>
                                                    <th className="py-3 px-6 font-bold text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {DAYS.map(({ key, short, label }) => {
                                                    const isWorkDay = schedule[key] as boolean

                                                    return (
                                                        <tr
                                                            key={key}
                                                            className={cn(
                                                                'border-b last:border-0 hover:bg-muted/5 transition-colors',
                                                                !isWorkDay && 'bg-muted/5'
                                                            )}
                                                        >
                                                            <td className="py-3 px-6">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-foreground">{short}</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">{label}</span>
                                                                </div>
                                                            </td>

                                                            <td className="py-3 px-4 text-center">
                                                                <span
                                                                    className={cn(
                                                                        'text-[10px] border rounded-lg px-2 py-0.5 font-bold uppercase tracking-tighter inline-block w-14 text-center',
                                                                        isWorkDay
                                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                                            : 'bg-muted text-muted-foreground border-border opacity-60'
                                                                    )}
                                                                >
                                                                    {isWorkDay ? 'Work' : 'Off'}
                                                                </span>
                                                            </td>

                                                            <td className="py-3 px-4">
                                                                <span className="font-medium text-xs">
                                                                    {isWorkDay ? `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}` : '—'}
                                                                </span>
                                                            </td>

                                                            <td className="py-3 px-4">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {isWorkDay && schedule.breakMinutes > 0 ? `${schedule.breakMinutes}m` : '—'}
                                                                </span>
                                                            </td>

                                                            <td className="py-3 px-6 text-right font-mono text-xs font-bold text-muted-foreground">
                                                                {isWorkDay ? formatDuration(totalMinutes) : '—'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <div className="space-y-6">
                    {/* ── Pending Changes sidebar ── */}
                    <Card className="border-blue-100 shadow-sm bg-blue-50/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-blue-600" />
                                Upcoming Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pendingShifts.length > 0 ? (
                                pendingShifts.map(pending => (
                                    <div key={pending.id} className="p-4 bg-background rounded-xl border border-blue-200 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold text-[10px]">PENDING</Badge>
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                                                Starting {format(new Date(pending.effectiveDate), 'PP')}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-extrabold tracking-tight">
                                                {formatTime(pending.startTime)} — {formatTime(pending.endTime)}
                                            </p>
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {DAYS.map(d => pending[d.key] && (
                                                    <span key={d.key} className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">{d.short}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic leading-tight pt-1">
                                            This schedule will automatically take effect on its start date.
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 px-4 opacity-60">
                                    <ShieldCheck className="w-10 h-10 text-muted-foreground/30" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No pending changes</p>
                                        <p className="text-[10px] text-muted-foreground">Your work schedule is not slated for any upcoming updates.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Notes/Policy Card ── */}
                    <Card className="border-muted shadow-none bg-muted/20 border-dashed">
                        <CardContent className="pt-6 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Schedule Guidelines</h4>
                            <ul className="space-y-2">
                                <li className="text-[11px] text-muted-foreground leading-relaxed">
                                    • Schedule changes are managed by HR. If you notice a discrepancy, please contact your supervisor.
                                </li>
                                <li className="text-[11px] text-muted-foreground leading-relaxed">
                                    • Overtime requests should be filed separately from your regular work schedule.
                                </li>
                                <li className="text-[11px] text-muted-foreground leading-relaxed">
                                    • For flexible shifts, you are expected to fulfill the required total hours per day.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

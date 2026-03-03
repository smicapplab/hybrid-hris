'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { WorkSchedule } from '@/types/work-schedule.type'
import { DAYS } from '@/lib/work-schedule.enum'


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
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function WorkSchedulePage() {
    const { user } = useAuth()
    const [schedule, setSchedule] = useState<WorkSchedule | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        apiFetch<WorkSchedule | null>('/profile/me/work-schedule')
            .then(setSchedule)
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

    if (!schedule) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                    <Calendar className="w-10 h-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground font-medium">No work schedule assigned</p>
                    <p className="text-xs text-muted-foreground">Contact HR to get a shift assigned to your account.</p>
                </CardContent>
            </Card>
        )
    }

    const totalMinutes = totalWorkMinutes(schedule.startTime, schedule.endTime, schedule.breakMinutes)
    const workDayCount = DAYS.filter(d => schedule[d.key] as boolean).length

    return (
        <div className="p-6 space-y-4 max-w-4xl">
            {/* ── Shift info card ── */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                                Assigned Shift
                            </p>
                            <h2 className="text-lg font-bold leading-tight">{schedule.templateName}</h2>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground mt-1 inline-block">
                                {schedule.templateCode}
                            </code>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            <span className={cn(
                                'text-xs border rounded-full px-2.5 py-0.5 font-medium',
                                schedule.isFlexible
                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                            )}>
                                {schedule.isFlexible ? 'Flexible' : 'Fixed'}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                Since {format(parseISO(schedule.effectiveFrom), 'PPP')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-4 pt-5 border-t">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Start</p>
                            <p className="text-sm font-semibold">{formatTime(schedule.startTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">End</p>
                            <p className="text-sm font-semibold">{formatTime(schedule.endTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Break</p>
                            <p className="text-sm font-semibold">{schedule.breakMinutes}m</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                            {formatDuration(totalMinutes)} per day ·{' '}
                            {workDayCount} day{workDayCount !== 1 ? 's' : ''} per week
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* ── Weekly schedule ── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Weekly Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="py-2 pr-4 font-medium">Day</th>
                                    <th className="py-2 pr-4 font-medium">Status</th>
                                    <th className="py-2 pr-4 font-medium">Start</th>
                                    <th className="py-2 pr-4 font-medium">End</th>
                                    <th className="py-2 pr-4 font-medium">Break</th>
                                    <th className="py-2 pr-4 font-medium">Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map(({ key, short }) => {
                                    const isWorkDay = schedule[key] as boolean

                                    return (
                                        <tr
                                            key={key}
                                            className={cn(
                                                'border-b last:border-0',
                                                !isWorkDay && 'opacity-50'
                                            )}
                                        >
                                            <td className="py-3 pr-4 font-semibold text-muted-foreground uppercase">
                                                {short}
                                            </td>

                                            <td className="py-3 pr-4">
                                                <span
                                                    className={cn(
                                                        'text-xs border rounded-full px-2 py-0.5 font-medium',
                                                        isWorkDay
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-muted text-muted-foreground border-border'
                                                    )}
                                                >
                                                    {isWorkDay ? 'Work' : 'Off'}
                                                </span>
                                            </td>

                                            <td className="py-3 pr-4">
                                                {isWorkDay ? formatTime(schedule.startTime) : '-'}
                                            </td>

                                            <td className="py-3 pr-4">
                                                {isWorkDay ? formatTime(schedule.endTime) : '-'}
                                            </td>

                                            <td className="py-3 pr-4">
                                                {isWorkDay && schedule.breakMinutes > 0
                                                    ? `${schedule.breakMinutes}m`
                                                    : '-'}
                                            </td>

                                            <td className="py-3 pr-4">
                                                {isWorkDay ? formatDuration(totalMinutes) : '-'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

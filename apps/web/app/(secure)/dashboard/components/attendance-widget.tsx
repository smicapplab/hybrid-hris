'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, LogIn, LogOut, Loader2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

type AttendanceLog = {
    id: string
    workDate: string
    actualInAt: string | null
    actualOutAt: string | null
}

type AttendanceStatus = {
    today: AttendanceLog | null
    last: AttendanceLog | null
    serverTime: string
    timezone: string
}

export default function AttendanceWidget() {
    const { toast } = useToast()
    const [status, setStatus] = useState<AttendanceStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    const loadStatus = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiFetch<AttendanceStatus>('/attendance/status')
            setStatus(data)
        } catch {
            // Silently fail, status will remain null and show loader or fallback
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadStatus()
    }, [loadStatus])

    // Update the clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleAction = async (type: 'in' | 'out') => {
        setActionLoading(true)
        try {
            const endpoint = type === 'in' ? '/attendance/time-in' : '/attendance/time-out'
            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ source: 'WEB' })
            })
            toast({
                title: type === 'in' ? 'Timed In' : 'Timed Out',
                description: `Successfully recorded at ${format(new Date(), 'hh:mm:ss a')}`,
                variant: 'success'
            })
            await loadStatus()
        } catch (error) {
            toast({
                title: 'Attendance Error',
                description: error instanceof Error ? error.message : 'Failed to record attendance',
                variant: 'destructive'
            })
        } finally {
            setActionLoading(false)
        }
    }

    if (loading && !status) {
        return (
            <Card className="shadow-sm">
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    const today = status?.today
    const last = status?.last
    const isTimedIn = !!(today?.actualInAt && !today?.actualOutAt)

    return (
        <Card className="shadow-sm border-blue-100 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
            <CardHeader className="pb-2 border-b bg-white/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Bundy Clock
                    </CardTitle>
                    <Link href="/me/attendance-history" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                        History <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Digital Clock */}
                    <div className="space-y-1">
                        <div className="text-3xl font-mono font-bold tracking-tighter text-gray-900">
                            {format(currentTime, 'hh:mm:ss a')}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                            {format(currentTime, 'EEEE, MMM dd yyyy')}
                        </div>
                    </div>

                    {/* Status Info */}
                    {today?.actualInAt && (
                        <div className="bg-blue-100/50 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isTimedIn ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                            <span className="text-[11px] font-semibold text-blue-900">
                                {isTimedIn 
                                    ? `In: ${format(new Date(today.actualInAt), 'hh:mm a')}`
                                    : `In: ${format(new Date(today.actualInAt), 'hh:mm a')} · Out: ${format(new Date(today.actualOutAt!), 'hh:mm a')}`
                                }
                            </span>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="w-full pt-2">
                        {!isTimedIn ? (
                            <Button 
                                onClick={() => handleAction('in')} 
                                disabled={actionLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-sm font-bold gap-2 shadow-md shadow-blue-200"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                TIME IN
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => handleAction('out')} 
                                disabled={actionLoading}
                                variant="destructive"
                                className="w-full h-12 text-sm font-bold gap-2 shadow-md shadow-red-200"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                TIME OUT
                            </Button>
                        )}
                    </div>

                    {/* Last Status */}
                    {last && (
                        <div className="pt-2 border-t w-full">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mb-1">Most Recent Attendance</p>
                            <div className="flex justify-between text-[11px] font-medium text-gray-600 px-2">
                                <span className="text-gray-400 font-normal">{format(new Date(last.workDate), 'MMM dd')}</span>
                                <span>IN: {last.actualInAt ? format(new Date(last.actualInAt), 'hh:mm a') : '—'}</span>
                                <span>OUT: {last.actualOutAt ? format(new Date(last.actualOutAt), 'hh:mm a') : '—'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

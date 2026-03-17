'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import type { PresenceRecord, PresenceStatus } from '@/types/attendance.types'

interface PresenceResponse {
    data: PresenceRecord[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}
import { Clock, Search, UserCheck, UserMinus, UserX, Coffee, CalendarOff, LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STATUS_CONFIG: Record<PresenceStatus, { label: string, color: string, icon: LucideIcon }> = {
    ON_TIME: { label: 'ON TIME', color: 'bg-green-50 text-green-700 border-green-200', icon: UserCheck },
    LATE: { label: 'LATE', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    ABSENT: { label: 'ABSENT', color: 'bg-red-50 text-red-700 border-red-200', icon: UserX },
    ON_LEAVE: { label: 'ON LEAVE', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Coffee },
    OFF_DAY: { label: 'OFF DAY', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: CalendarOff },
    NO_SCHEDULE: { label: 'NO SHIFT', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: UserMinus },
}

export default function PresenceDashboardPage() {
    const { toast } = useToast()
    const [records, setPresenceRecords] = useState<PresenceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [totalRecords, setTotalRecords] = useState(0)

    const fetchPresence = useCallback(async (pageNum = 1, append = false) => {
        if (!append) setLoading(true)
        else setLoadingMore(true)

        try {
            // Using a default limit of 50
            const response = await apiFetch<PresenceResponse>(`/attendance/presence?page=${pageNum}&limit=50`)
            
            if (append) {
                setPresenceRecords(prev => [...prev, ...response.data])
            } else {
                setPresenceRecords(response.data)
            }
            
            setHasMore(response.meta.page < response.meta.totalPages)
            setPage(response.meta.page)
            setTotalRecords(response.meta.total)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load presence data", variant: "destructive" })
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [toast])

    useEffect(() => {
        fetchPresence(1, false)
        // Refresh page 1 every 5 minutes
        const interval = setInterval(() => fetchPresence(1, false), 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [fetchPresence])

    // Infinite scroll observer
    const observer = useRef<IntersectionObserver | null>(null)
    const lastRecordRef = useCallback((node: HTMLTableRowElement | null) => {
        if (loadingMore) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchPresence(page + 1, true)
            }
        })
        if (node) observer.current.observe(node)
    }, [loadingMore, hasMore, fetchPresence, page])

    const filteredRecords = useMemo(() => {
        return records.filter(r => 
            r.employee.firstName.toLowerCase().includes(search.toLowerCase()) ||
            r.employee.lastName.toLowerCase().includes(search.toLowerCase()) ||
            r.employee.employeeNo.toLowerCase().includes(search.toLowerCase())
        )
    }, [records, search])

    const stats = useMemo(() => {
        const counts = {
            TOTAL: totalRecords,
            ON_TIME: records.filter(r => r.status === 'ON_TIME').length,
            LATE: records.filter(r => r.status === 'LATE').length,
            ABSENT: records.filter(r => r.status === 'ABSENT').length,
            ON_LEAVE: records.filter(r => r.status === 'ON_LEAVE').length,
        }
        return counts
    }, [records])

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Real-time Presence</h1>
                    <p className="text-muted-foreground text-sm font-medium">Who is currently in the building?</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold uppercase tracking-widest text-primary">{format(new Date(), 'EEEE, PP')}</p>
                    <p className="text-xs text-muted-foreground">Auto-refreshes every 5 mins</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Staff', value: stats.TOTAL, color: 'text-foreground', icon: UserCheck },
                    { label: 'On Time', value: stats.ON_TIME, color: 'text-green-600', icon: UserCheck },
                    { label: 'Late', value: stats.LATE, color: 'text-amber-600', icon: Clock },
                    { label: 'Absent', value: stats.ABSENT, color: 'text-red-600', icon: UserX },
                    { label: 'On Leave', value: stats.ON_LEAVE, color: 'text-blue-600', icon: Coffee },
                ].map((stat, i) => (
                    <Card key={i} className="shadow-sm border-muted/60">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                <p className={cn("text-2xl font-extrabold", stat.color)}>{stat.value}</p>
                            </div>
                            <div className={cn("p-2 rounded-lg bg-muted/50", stat.color.replace('text', 'bg').replace('600', '100'))}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search employee name or no..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="sm" onClick={fetchPresence} className="font-bold">
                    Refresh Now
                </Button>
            </div>

            <Card className="shadow-sm border-muted/60">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Employee</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Scheduled In</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Actual In</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Delay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && records.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Loading live presence data...</TableCell></TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No matching records found.</TableCell></TableRow>
                            ) : filteredRecords.map((r, index) => {
                                const cfg = STATUS_CONFIG[r.status]
                                const isLast = index === filteredRecords.length - 1
                                
                                return (
                                    <TableRow 
                                        key={r.employee.id} 
                                        className="group"
                                        ref={isLast ? lastRecordRef : undefined}
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{r.employee.firstName} {r.employee.lastName}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{r.employee.employeeNo}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-bold text-[10px] tracking-tight", cfg.color)}>
                                                <cfg.icon className="w-3 h-3 mr-1" />
                                                {cfg.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {r.log?.scheduledInAt ? format(new Date(r.log.scheduledInAt), 'p') : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm font-bold">
                                            {r.log?.actualInAt ? format(new Date(r.log.actualInAt), 'p') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {r.status === 'LATE' && r.log?.actualInAt && r.log?.scheduledInAt ? (
                                                <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                    +{Math.floor((new Date(r.log.actualInAt).getTime() - new Date(r.log.scheduledInAt).getTime()) / 60000)}m
                                                </span>
                                            ) : r.status === 'ON_TIME' && r.log?.gracePeriodMinutes ? (
                                                <span className="text-[10px] text-muted-foreground italic">Within {r.log.gracePeriodMinutes}m grace</span>
                                            ) : '—'}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            
                            {loadingMore && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground font-medium animate-pulse">
                                        Loading more records...
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

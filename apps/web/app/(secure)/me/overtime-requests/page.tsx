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
import { Badge } from '@/components/ui/badge'
import { Timer, Plus, History, Loader2, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { OvertimeRequest } from '@/types/attendance.types'
import { OvertimeRequestDialog } from '../../dashboard/components/overtime-request-dialog'
import { useToast } from '@/hooks/use-toast'

const STATUS_CONFIG: Record<string, { label: string, className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200' },
    REJECTED: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
}

export default function OvertimeRequestsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [requests, setRequests] = useState<OvertimeRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [isOtOpen, setIsOtOpen] = useState(false)

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiFetch<OvertimeRequest[]>('/attendance/overtime-requests/me')
            setRequests(data ?? [])
        } catch (err) {
            toast({ 
                title: 'Error', 
                description: err instanceof Error ? err.message : 'Failed to load requests', 
                variant: 'destructive' 
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        if (user) loadRequests()
    }, [user, loadRequests])

    if (!user) return null

    return (
        <div className="p-6 space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-900">Overtime Requests</h1>
                    <p className="text-muted-foreground text-sm">Manage and track your overtime filings.</p>
                </div>
                <Button onClick={() => setIsOtOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> File Overtime
                </Button>
            </div>

            <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-3 bg-blue-50/20 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-600" />
                        Filing History
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    {loading && requests.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-200" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Timer className="w-10 h-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground font-medium">
                                No overtime requests found.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Hours</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Processed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map(req => (
                                    <TableRow key={req.id} className="hover:bg-blue-50/30 transition-colors">
                                        <TableCell className="font-medium text-sm text-blue-900">
                                            {format(parseISO(req.date), 'EEE, MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium">
                                                {req.type.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-bold tabular-nums">
                                            {req.hours}h
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {req.reason}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-bold text-[10px] uppercase", STATUS_CONFIG[req.status]?.className)}>
                                                {STATUS_CONFIG[req.status]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {req.status === 'REJECTED' ? (
                                                <div className="flex items-center gap-1.5 text-destructive font-medium text-[11px]">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span className="max-w-32 truncate" title={req.rejectionReason || 'No reason provided'}>
                                                        {req.rejectionReason || 'Rejected'}
                                                    </span>
                                                </div>
                                            ) : req.approvedAt ? (
                                                <div className="flex items-center gap-1.5 text-green-600 font-medium text-[11px]">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{format(parseISO(req.approvedAt), 'MMM d, h:mm a')}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <OvertimeRequestDialog 
                open={isOtOpen}
                onOpenChangeAction={setIsOtOpen}
                onSuccessAction={loadRequests}
            />
        </div>
    )
}

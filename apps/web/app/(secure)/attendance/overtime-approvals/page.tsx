'use client'

import { useState, useEffect, useCallback } from 'react'
import { OvertimeRequest, PendingOvertimeItem } from '@/types/attendance.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Timer, Calendar, Clock, Search, Filter, Loader2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api'

type OvertimeWithEmployee = OvertimeRequest & {
    employee: {
        firstName: string;
        lastName: string;
        employeeNo: string;
    }
}

const STATUS_CONFIG: Record<string, { label: string, className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200' },
    REJECTED: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
}

export default function OvertimeApprovalsPage() {
    const { toast } = useToast()
    const [items, setItems] = useState<OvertimeWithEmployee[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('PENDING')

    // Action Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<OvertimeWithEmployee | null>(null)
    const [action, setAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
    const [remarks, setRemarks] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const query = new URLSearchParams()
            if (statusFilter !== 'ALL') query.append('status', statusFilter)
            
            const data = await apiFetch<PendingOvertimeItem[]>(`/attendance/overtime-requests?${query.toString()}`)
            
            const transformed = data?.map(d => ({ ...d.request, employee: d.employee })) ?? [];
            setItems(transformed as OvertimeWithEmployee[]);
        } catch (error) {
            console.error('Failed to load overtime requests:', error)
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => {
        loadData()
    }, [loadData])

    const openAction = (item: OvertimeWithEmployee, act: 'APPROVED' | 'REJECTED') => {
        setSelectedItem(item)
        setAction(act)
        setRemarks('')
        setDialogOpen(true)
    }

    const handleAction = async () => {
        if (!selectedItem) return
        setSubmitting(true)
        try {
            await apiFetch(`/attendance/overtime-requests/${selectedItem.id}/process`, {
                method: 'PATCH',
                body: JSON.stringify({ 
                    status: action,
                    rejectionReason: action === 'REJECTED' ? remarks : undefined
                })
            })
            toast({ title: `Overtime ${action === 'APPROVED' ? 'Approved' : 'Rejected'}`, variant: 'success' })
            setDialogOpen(false)
            loadData()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Action failed';
            toast({ title: 'Action failed', description: message, variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    const filteredItems = items.filter(item => {
        const fullName = `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase()
        return fullName.includes(search.toLowerCase()) || item.employee.employeeNo.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <div className="p-6 space-y-6 text-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-900">Overtime Approvals</h1>
                    <p className="text-muted-foreground">Review and process team overtime filings.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employee..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="shadow-sm border-orange-50">
                <CardHeader className="bg-orange-50/20 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                        <Timer className="w-5 h-5 text-orange-600" />
                        Overtime Requests Queue
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="pl-6">Employee</TableHead>
                                <TableHead>Work Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-center">Hours</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-orange-200" />
                                            <span>Loading requests...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No overtime requests found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-orange-50/30 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="font-semibold text-blue-900">{item.employee.firstName} {item.employee.lastName}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{item.employee.employeeNo}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-medium text-sm">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                                {item.date ? format(parseISO(item.date), 'MMM dd, yyyy') : 'Invalid Date'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium">
                                                {item.type.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1 font-bold text-orange-700">
                                                <Clock className="w-3 h-3" />
                                                {item.hours}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-zinc-600 italic line-clamp-2 max-w-62.5" title={item.reason}>
                                                &quot;{item.reason}&quot;
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-bold text-[10px] uppercase", STATUS_CONFIG[item.status]?.className)}>
                                                {STATUS_CONFIG[item.status]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {item.status === 'PENDING' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                        onClick={() => openAction(item, 'REJECTED')}
                                                        disabled={submitting}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-white font-bold"
                                                        onClick={() => openAction(item, 'APPROVED')}
                                                        disabled={submitting}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Approve
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold pr-2">
                                                    Processed
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {action === 'APPROVED' ? (
                                <Check className="w-5 h-5 text-green-600" />
                            ) : (
                                <X className="w-5 h-5 text-red-600" />
                            )}
                            {action === 'APPROVED' ? 'Approve' : 'Reject'} Overtime
                        </DialogTitle>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="py-4 space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2 text-muted-foreground border border-blue-50">
                                <p><span className="font-semibold">Employee:</span> {selectedItem.employee.firstName} {selectedItem.employee.lastName}</p>
                                <p><span className="font-semibold">Work Date:</span> {selectedItem.date ? format(parseISO(selectedItem.date), 'PPPP') : 'N/A'}</p>
                                <p><span className="font-semibold">Duration:</span> {selectedItem.hours} Hours ({selectedItem.type})</p>
                                <p><span className="font-semibold">Reason:</span> {selectedItem.reason}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks" className="text-sm">
                                    {action === 'APPROVED' ? 'Approver Remarks (Optional)' : 'Rejection Reason (Required)'}
                                </Label>
                                <Textarea
                                    id="remarks"
                                    placeholder={action === 'APPROVED' ? "Notes for approval..." : "Explain why this request is being rejected..."}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="min-h-20"
                                    required={action === 'REJECTED'}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={submitting || (action === 'REJECTED' && !remarks.trim())}
                            className={action === 'APPROVED' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm {action === 'APPROVED' ? 'Approval' : 'Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

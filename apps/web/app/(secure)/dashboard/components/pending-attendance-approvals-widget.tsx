'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { PendingAdjustmentItem } from '@/types/attendance.types'
import { ClipboardList, User, Calendar, Clock, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function PendingAttendanceApprovalsWidget() {
    const { toast } = useToast()
    const [items, setItems] = useState<PendingAdjustmentItem[]>([])
    const [loading, setLoading] = useState(true)
    
    // Action Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<PendingAdjustmentItem | null>(null)
    const [action, setAction] = useState<'approve' | 'reject'>('approve')
    const [remarks, setRemarks] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(async () => {
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

    useEffect(() => { load() }, [load])

    const openAction = (item: PendingAdjustmentItem, act: 'approve' | 'reject') => {
        setSelectedItem(item)
        setAction(act)
        setRemarks('')
        setDialogOpen(true)
    }

    const handleAction = async () => {
        if (!selectedItem) return
        setSubmitting(true)
        try {
            await apiFetch(`/attendance-adjustments/${selectedItem.adjustment.id}/${action}`, {
                method: 'PATCH',
                body: JSON.stringify({ remarks })
            })
            toast({ title: `Adjustment ${action === 'approve' ? 'Approved' : 'Rejected'}`, variant: 'success' })
            setDialogOpen(false)
            load()
        } catch (err: any) {
            toast({ title: 'Action failed', description: err.message, variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    const formatTime = (iso: string | null) => {
        if (!iso) return 'MISSING'
        return format(new Date(iso), 'h:mm a')
    }

    if (loading && items.length === 0) {
        return (
            <div className="rounded-xl border bg-white p-4 shadow-sm animate-pulse">
                <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
                <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-50 rounded-lg" />)}
                </div>
            </div>
        )
    }

    if (items.length === 0) return null

    return (
        <>
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden border-blue-100">
                <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-900">Pending Attendance Adjustments</h3>
                        <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-5 h-5 inline-flex items-center justify-center font-bold">
                            {items.length}
                        </span>
                    </div>
                </div>

                <ul className="divide-y divide-blue-50 max-h-[400px] overflow-y-auto">
                    {items.map((item) => (
                        <li key={item.adjustment.id} className="px-4 py-3 hover:bg-blue-50/30 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                        <p className="text-sm font-bold text-blue-900 truncate">
                                            {item.employee.firstName} {item.employee.lastName}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {format(new Date(item.adjustment.workDate), 'MMM d')}
                                        </div>
                                        <div className="flex items-center gap-1 font-medium text-blue-700">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(item.adjustment.requestedActualInAt)} – {formatTime(item.adjustment.requestedActualOutAt)}
                                        </div>
                                    </div>
                                    {item.adjustment.remarks && (
                                        <p className="text-[11px] text-gray-400 italic mt-1 line-clamp-1">
                                            "{item.adjustment.remarks}"
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 w-7 p-0 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => openAction(item, 'reject')}
                                        title="Reject"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 w-7 p-0 text-green-600 border-green-100 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => openAction(item, 'approve')}
                                        title="Approve"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="px-4 py-2 border-t bg-gray-50/50">
                    <Button variant="link" size="sm" className="h-4 p-0 text-[11px] text-blue-600" asChild>
                        <a href="/attendance/approvals">View All Requests</a>
                    </Button>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {action === 'approve' ? (
                                <Check className="w-5 h-5 text-green-600" />
                            ) : (
                                <X className="w-5 h-5 text-red-600" />
                            )}
                            {action === 'approve' ? 'Approve' : 'Reject'} Adjustment
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedItem && (
                        <div className="py-4 space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2 text-muted-foreground">
                                <p><span className="font-semibold">Employee:</span> {selectedItem.employee.firstName} {selectedItem.employee.lastName}</p>
                                <p><span className="font-semibold">Work Date:</span> {format(new Date(selectedItem.adjustment.workDate), 'PPPP')}</p>
                                <p><span className="font-semibold">Requested:</span> {formatTime(selectedItem.adjustment.requestedActualInAt)} – {formatTime(selectedItem.adjustment.requestedActualOutAt)}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks" className="text-sm">Approver Remarks (Optional)</Label>
                                <Textarea
                                    id="remarks"
                                    placeholder={action === 'approve' ? "Notes for approval..." : "Reason for rejection..."}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="min-h-[80px]"
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
                            disabled={submitting}
                            className={action === 'approve' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

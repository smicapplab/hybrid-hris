'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { PendingOvertimeItem } from '@/types/attendance.types'
import { Timer, User, Calendar, Clock, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
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

export default function PendingOvertimeApprovalsWidget() {
    const { toast } = useToast()
    const [items, setItems] = useState<PendingOvertimeItem[]>([])
    const [loading, setLoading] = useState(true)

    // Action Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<PendingOvertimeItem | null>(null)
    const [action, setAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
    const [remarks, setRemarks] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiFetch<PendingOvertimeItem[]>('/attendance/overtime-requests/pending')
            setItems(data ?? [])
        } catch (error) {
            console.error('Failed to load pending overtime:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const openAction = (item: PendingOvertimeItem, act: 'APPROVED' | 'REJECTED') => {
        setSelectedItem(item)
        setAction(act)
        setRemarks('')
        setDialogOpen(true)
    }

    const handleAction = async () => {
        if (!selectedItem) return
        setSubmitting(true)
        try {
            await apiFetch(`/attendance/overtime-requests/${selectedItem.request.id}/process`, {
                method: 'PATCH',
                body: JSON.stringify({ 
                    status: action,
                    rejectionReason: action === 'REJECTED' ? remarks : undefined
                })
            })
            toast({ title: `Overtime ${action === 'APPROVED' ? 'Approved' : 'Rejected'}`, variant: 'success' })
            setDialogOpen(false)
            load()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Action failed';
            toast({ title: 'Action failed', description: message, variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
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
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden border-orange-100">
                <div className="px-4 py-3 border-b bg-linear-to-r from-orange-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-semibold text-orange-900">Pending Overtime Requests</h3>
                        <span className="ml-1 text-xs bg-orange-600 text-white rounded-full w-5 h-5 inline-flex items-center justify-center font-bold">
                            {items.length}
                        </span>
                    </div>
                </div>

                <ul className="divide-y divide-orange-50 max-h-100 overflow-y-auto">
                    {items.map((item) => (
                        <li key={item.request.id} className="px-4 py-3 hover:bg-orange-50/30 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                        <p className="text-sm font-bold text-orange-900 truncate">
                                            {item.employee.firstName} {item.employee.lastName}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {format(parseISO(item.request.date), 'MMM d')}
                                        </div>
                                        <div className="flex items-center gap-1 font-medium text-orange-700">
                                            <Clock className="w-3 h-3" />
                                            {item.request.hours} Hours ({item.request.type.replace('_', ' ')})
                                        </div>
                                    </div>
                                    {item.request.reason && (
                                        <p className="text-[11px] text-gray-400 italic mt-1 line-clamp-1">
                                            &quot;{item.request.reason}&quot;
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 w-7 p-0 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => openAction(item, 'REJECTED')}
                                        title="Reject"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 w-7 p-0 text-green-600 border-green-100 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => openAction(item, 'APPROVED')}
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
                    <Button variant="link" size="sm" className="h-4 p-0 text-[11px] text-orange-600" asChild>
                        <a href="/attendance/overtime-approvals">View All OT Requests</a>
                    </Button>
                </div>
            </div>

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
                            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2 text-muted-foreground">
                                <p><span className="font-semibold">Employee:</span> {selectedItem.employee.firstName} {selectedItem.employee.lastName}</p>
                                <p><span className="font-semibold">Work Date:</span> {format(parseISO(selectedItem.request.date), 'PPPP')}</p>
                                <p><span className="font-semibold">Duration:</span> {selectedItem.request.hours} Hours ({selectedItem.request.type})</p>
                                <p><span className="font-semibold">Reason:</span> {selectedItem.request.reason}</p>
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
        </>
    )
}

'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { PendingApprovalItem, formatDateRange } from '@/types/leave-requests.types'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, CalendarDays, User } from 'lucide-react'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    request: PendingApprovalItem | null
    action: 'approve' | 'reject'
    onSuccess: () => void
}

export default function ActOnRequestDialog({ open, onOpenChange, request, action, onSuccess }: Props) {
    const { toast } = useToast()
    const [remarks, setRemarks] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!request) return null

    const isApprove = action === 'approve'

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            await apiFetch(`/leave-requests/${request.id}/${action}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remarks: remarks.trim() || undefined }),
            })
            toast({
                title: isApprove ? 'Leave request approved' : 'Leave request rejected',
                variant: 'default',
            })
            onSuccess()
            onOpenChange(false)
            setRemarks('')
        } catch (err: unknown) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Action failed',
                variant: 'destructive',
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${isApprove ? 'text-green-700' : 'text-red-700'}`}>
                        {isApprove
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <XCircle className="w-5 h-5" />}
                        {isApprove ? 'Approve' : 'Reject'} Leave Request
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-1">
                    {/* Summary */}
                    <div className="rounded-lg bg-gray-50 border p-3 text-sm space-y-1">
                        <div className="flex items-center gap-2 text-gray-700">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium">{request.employeeFirstName} {request.employeeLastName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{request.leaveTypeName} · {formatDateRange(request.startDate, request.endDate)}</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                            {request.days} {request.days === 1 ? 'day' : 'days'}
                            {request.notes && ` · "${request.notes}"`}
                        </p>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-1.5">
                        <Label>
                            Remarks
                            {!isApprove && <span className="text-red-500 ml-0.5">*</span>}
                            {isApprove && <span className="text-gray-400 font-normal"> (optional)</span>}
                        </Label>
                        <textarea
                            value={remarks}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                            placeholder={isApprove ? 'Optional remarks…' : 'Reason for rejection…'}
                            rows={3}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant={isApprove ? 'default' : 'destructive'}
                        onClick={handleSubmit}
                        disabled={submitting || (!isApprove && !remarks.trim())}
                    >
                        {submitting ? 'Processing…' : isApprove ? 'Approve' : 'Reject'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { AttendanceLog } from '@/types/attendance.types'
import { format } from 'date-fns'
import { DateTimeRangePickerField } from '@/components/ui/date-time-range-picker-field'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    initialLog?: AttendanceLog | null
    onSuccessAction: () => void
}

export function AttendanceAdjustmentDialog({ open, onOpenChangeAction, initialLog, onSuccessAction }: Props) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    // Form State
    const [workDate, setWorkDate] = useState(initialLog?.workDate || format(new Date(), 'yyyy-MM-dd'))
    
    // Using ISO strings for the unified picker
    const [inTs, setInTs] = useState('')
    const [outTs, setOutTs] = useState('')
    
    const [remarks, setRemarks] = useState('')

    // Sync from initialLog if provided
    useEffect(() => {
        if (initialLog) {
            setWorkDate(initialLog.workDate)
            setRemarks(initialLog.pendingRemarks || '')
            
            // If editing a pending adjustment, use those times. Otherwise use actual times.
            const startTs = initialLog.pendingActualInAt || initialLog.actualInAt
            const endTs = initialLog.pendingActualOutAt || initialLog.actualOutAt

            if (startTs) setInTs(new Date(startTs).toISOString())
            else setInTs(`${initialLog.workDate}T08:00:00Z`)

            if (endTs) setOutTs(new Date(endTs).toISOString())
            else setOutTs(`${initialLog.workDate}T17:00:00Z`)
        } else {
            const today = format(new Date(), 'yyyy-MM-dd')
            setInTs(`${today}T08:00:00Z`)
            setOutTs(`${today}T17:00:00Z`)
        }
    }, [initialLog])

    // When workDate changes (Missing Entry mode), update the picker bounds
    const handleWorkDateChange = (v: string) => {
        setWorkDate(v)
        // Maintain the same time but update the date part
        const oldInTime = inTs ? inTs.split('T')[1] : '08:00:00Z'
        const oldOutTime = outTs ? outTs.split('T')[1] : '17:00:00Z'
        setInTs(`${v}T${oldInTime}`)
        setOutTs(`${v}T${oldOutTime}`)
    }

    const handleRangeChange = (start: string, end: string) => {
        setInTs(start)
        setOutTs(end)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const isEdit = !!initialLog?.pendingAdjustmentId

            if (isEdit) {
                await apiFetch(`/attendance-adjustments/${initialLog.pendingAdjustmentId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        requestedActualInAt: inTs,
                        requestedActualOutAt: outTs,
                        remarks,
                    })
                })
            } else {
                await apiFetch('/attendance-adjustments', {
                    method: 'POST',
                    body: JSON.stringify({
                        workDate,
                        attendanceLogId: initialLog?.id,
                        requestedActualInAt: inTs,
                        requestedActualOutAt: outTs,
                        remarks,
                    })
                })
            }

            toast({ 
                title: isEdit ? 'Request Updated' : 'Request Submitted', 
                description: isEdit 
                    ? 'Your attendance adjustment request has been updated.' 
                    : 'Your attendance adjustment has been sent for approval.', 
                variant: 'success' 
            })
            onSuccessAction()
            onOpenChangeAction(false)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Submission failed';
            toast({ title: 'Submission failed', description: message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-112.5">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {initialLog?.pendingAdjustmentId 
                                ? 'Edit Adjustment Request' 
                                : initialLog ? 'Correct Attendance' : 'File Missing Entry'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        {/* Work Date - Locked if correcting existing log */}
                        <div className="grid gap-2">
                            <Label htmlFor="workDate">Work Date</Label>
                            <Input
                                id="workDate"
                                type="date"
                                value={workDate}
                                onChange={(e) => handleWorkDateChange(e.target.value)}
                                disabled={!!initialLog}
                                required
                            />
                            {initialLog && <p className="text-[10px] text-muted-foreground italic">Work date cannot be changed for existing records.</p>}
                        </div>

                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-4 text-foreground">
                            <DateTimeRangePickerField
                                label="Requested Attendance Period"
                                startAt={inTs}
                                endAt={outTs}
                                onChangeAction={handleRangeChange}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="remarks">Reason for Adjustment</Label>
                            <Textarea
                                id="remarks"
                                placeholder="Explain why this correction is needed..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                required
                                className="min-h-20"
                            />
                        </div>

                        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                                <strong>Tip:</strong> For night shifts, ensure the &quot;Out&quot; date is set to the following calendar day if you timed out after midnight.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

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
import { format, parseISO, startOfDay, addDays } from 'date-fns'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialLog?: AttendanceLog | null
    onSuccess: () => void
}

export function AttendanceAdjustmentDialog({ open, onOpenChange, initialLog, onSuccess }: Props) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    // Form State
    const [workDate, setWorkDate] = useState(initialLog?.workDate || format(new Date(), 'yyyy-MM-dd'))
    
    // We use separate date and time strings for the UI pickers to avoid timezone confusion
    const [inDate, setInDate] = useState(workDate)
    const [inTime, setInTime] = useState('08:00')
    
    const [outDate, setOutDate] = useState(workDate)
    const [outTime, setOutTime] = useState('17:00')
    
    const [remarks, setRemarks] = useState('')

    // Sync from initialLog if provided
    useEffect(() => {
        if (initialLog) {
            setWorkDate(initialLog.workDate)
            setRemarks(initialLog.pendingRemarks || '')
            
            // If editing a pending adjustment, use those times. Otherwise use actual times.
            const inTs = initialLog.pendingActualInAt || initialLog.actualInAt
            const outTs = initialLog.pendingActualOutAt || initialLog.actualOutAt

            if (inTs) {
                const dateIn = new Date(inTs)
                setInDate(format(dateIn, 'yyyy-MM-dd'))
                setInTime(format(dateIn, 'HH:mm'))
            } else {
                setInDate(initialLog.workDate)
                setInTime('08:00')
            }

            if (outTs) {
                const dateOut = new Date(outTs)
                setOutDate(format(dateOut, 'yyyy-MM-dd'))
                setOutTime(format(dateOut, 'HH:mm'))
            } else {
                setOutDate(initialLog.workDate)
                setOutTime('17:00')
            }
        }
    }, [initialLog])

    // When workDate changes (Missing Entry mode), update the picker bounds
    const handleWorkDateChange = (v: string) => {
        setWorkDate(v)
        setInDate(v)
        setOutDate(v)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Combine date and time strings into ISO strings
            const requestedIn = `${inDate}T${inTime}:00Z`
            const requestedOut = `${outDate}T${outTime}:00Z`

            const isEdit = !!initialLog?.pendingAdjustmentId

            if (isEdit) {
                await apiFetch(`/attendance-adjustments/${initialLog.pendingAdjustmentId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        requestedActualInAt: requestedIn,
                        requestedActualOutAt: requestedOut,
                        remarks,
                    })
                })
            } else {
                await apiFetch('/attendance-adjustments', {
                    method: 'POST',
                    body: JSON.stringify({
                        workDate,
                        attendanceLogId: initialLog?.id,
                        requestedActualInAt: requestedIn,
                        requestedActualOutAt: requestedOut,
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
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            toast({ title: 'Submission failed', description: err.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
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

                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-4">
                            {/* Requested Time In */}
                            <div className="space-y-2">
                                <Label className="text-blue-900 font-bold text-xs uppercase">Requested Time In</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="date" value={inDate} onChange={(e) => setInDate(e.target.value)} required />
                                    <Input type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} required />
                                </div>
                            </div>

                            {/* Requested Time Out */}
                            <div className="space-y-2">
                                <Label className="text-blue-900 font-bold text-xs uppercase">Requested Time Out</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="date" value={outDate} onChange={(e) => setOutDate(e.target.value)} required />
                                    <Input type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="remarks">Reason for Adjustment</Label>
                            <Textarea
                                id="remarks"
                                placeholder="Explain why this correction is needed..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                required
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                                <strong>Tip:</strong> For night shifts, ensure the 'Out' date is set to the following calendar day if you timed out after midnight.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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

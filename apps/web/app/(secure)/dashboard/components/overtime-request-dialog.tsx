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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { OvertimeType } from '@/types/attendance.types'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    initialDate?: string | null
    onSuccessAction?: () => void
}

export function OvertimeRequestDialog({ open, onOpenChangeAction, initialDate, onSuccessAction }: Props) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    // Form State
    const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
    const [hours, setHours] = useState('1.0')
    const [type, setType] = useState<OvertimeType>('REGULAR_OT')
    const [reason, setReason] = useState('')

    // Sync from initialDate if provided
    useEffect(() => {
        if (initialDate) {
            setDate(initialDate)
        }
    }, [initialDate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await apiFetch('/attendance/overtime-requests', {
                method: 'POST',
                body: JSON.stringify({
                    date,
                    hours: parseFloat(hours),
                    type,
                    reason,
                })
            })

            toast({ 
                title: 'Request Filed', 
                description: 'Your overtime request has been sent for approval.', 
                variant: 'success' 
            })
            
            if (onSuccessAction) onSuccessAction()
            onOpenChangeAction(false)
            
            // Reset form
            setReason('')
            setHours('1.0')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Submission failed';
            toast({ title: 'Submission failed', description: message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>File Overtime Request</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Work Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hours">OT Hours</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="16"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Overtime Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as OvertimeType)}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REGULAR_OT">Regular OT (Work Day)</SelectItem>
                                    <SelectItem value="REST_DAY_OT">Rest Day OT</SelectItem>
                                    <SelectItem value="HOLIDAY_OT">Holiday OT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason for Overtime</Label>
                            <Textarea
                                id="reason"
                                placeholder="Explain the task or project requiring overtime..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                className="min-h-20"
                            />
                        </div>

                        <div className="flex gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                                Overtime hours will only be reflected in your attendance logs after the request is <strong>approved</strong> and you have <strong>timed out</strong> for the day.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Filing
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

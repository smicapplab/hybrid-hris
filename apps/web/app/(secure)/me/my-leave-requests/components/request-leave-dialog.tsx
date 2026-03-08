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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { LeaveBalance, DayType, computeLeaveDays, computeMaxEndDate } from '@/types/leave-requests.types'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, CalendarDays, Info } from 'lucide-react'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    balances: LeaveBalance[]
    onSuccess: () => void
}

export default function RequestLeaveDialog({ open, onOpenChange, balances, onSuccess }: Props) {
    const { toast } = useToast()

    const [leaveTypeId, setLeaveTypeId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [startDayType, setStartDayType] = useState<DayType>('FULL')
    const [endDayType, setEndDayType] = useState<DayType>('FULL')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            setLeaveTypeId('')
            setStartDate('')
            setEndDate('')
            setStartDayType('FULL')
            setEndDayType('FULL')
            setNotes('')
            setError(null)
        }
    }, [open])

    // When startDate changes, auto-set endDate to same day
    useEffect(() => {
        if (startDate && !endDate) setEndDate(startDate)
        // If endDate is before startDate, reset it
        if (startDate && endDate && endDate < startDate) setEndDate(startDate)
    }, [startDate])

    const selectedBalance = balances.find((b) => b.leaveTypeId === leaveTypeId)
    const isMultiDay = startDate && endDate && startDate !== endDate

    const totalDays =
        startDate && endDate
            ? computeLeaveDays(startDate, endDate, startDayType, endDayType)
            : 0

    const maxEndDate =
        startDate && selectedBalance
            ? computeMaxEndDate(startDate, startDayType, selectedBalance.balance)
            : undefined

    const balanceAfter = selectedBalance ? selectedBalance.balance - totalDays : null
    const overBalance = balanceAfter !== null && balanceAfter < 0

    const handleSubmit = async () => {
        setError(null)
        if (!leaveTypeId) { setError('Please select a leave type'); return }
        if (!startDate) { setError('Please select a start date'); return }
        if (!endDate) { setError('Please select an end date'); return }
        if (totalDays <= 0) { setError('Invalid date range'); return }

        setSubmitting(true)
        try {
            await apiFetch('/leave-requests/my', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaveTypeId,
                    startDate,
                    endDate,
                    startDayType,
                    endDayType,
                    notes: notes.trim() || undefined,
                }),
            })
            toast({ title: 'Leave request submitted', description: `${totalDays} day(s) pending approval`, variant: 'default' })
            onSuccess()
            onOpenChange(false)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to submit request'
            setError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-500" />
                        Request Leave
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-1">
                    {/* Leave type */}
                    <div className="space-y-1.5">
                        <Label>Leave Type</Label>
                        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select leave type…" />
                            </SelectTrigger>
                            <SelectContent>
                                {balances.map((b) => (
                                    <SelectItem key={b.leaveTypeId} value={b.leaveTypeId}>
                                        <span>{b.leaveTypeName}</span>
                                        <span className="ml-2 text-xs text-gray-500">
                                            ({b.balance.toFixed(2)} days)
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedBalance && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <Info className="w-3.5 h-3.5" />
                                <span>
                                    Available: <strong>{selectedBalance.balance.toFixed(2)} days</strong>
                                    {selectedBalance.pendingDays > 0 && (
                                        <span className="ml-1 text-amber-600">
                                            · {selectedBalance.pendingDays.toFixed(2)} days pending approval
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Date row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>From</Label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>To</Label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value)
                                    setError(null)
                                }}
                                min={startDate || new Date().toISOString().split('T')[0]}
                                max={maxEndDate}
                                disabled={!startDate}
                                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Half-day options */}
                    {startDate && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-2">
                            <p className="text-xs font-medium text-blue-700">Day type options</p>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={startDayType === 'HALF'}
                                    onChange={(e) => setStartDayType(e.target.checked ? 'HALF' : 'FULL')}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700">
                                    I am starting my leave in the afternoon
                                    <span className="text-gray-400 text-xs ml-1">(half day)</span>
                                </span>
                            </label>
                            {isMultiDay && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={endDayType === 'HALF'}
                                        onChange={(e) => setEndDayType(e.target.checked ? 'HALF' : 'FULL')}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">
                                        I am returning in the afternoon on my last day
                                        <span className="text-gray-400 text-xs ml-1">(half day)</span>
                                    </span>
                                </label>
                            )}
                        </div>
                    )}

                    {/* Total days + balance indicator */}
                    {totalDays > 0 && (
                        <div className={`rounded-lg border p-3 flex items-center justify-between ${overBalance ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                            <div>
                                <p className="text-sm font-semibold">
                                    Total: {totalDays} {totalDays === 1 ? 'day' : 'days'}
                                </p>
                                {balanceAfter !== null && (
                                    <p className={`text-xs mt-0.5 ${overBalance ? 'text-red-600' : 'text-gray-500'}`}>
                                        Balance after: {balanceAfter.toFixed(2)} days
                                    </p>
                                )}
                            </div>
                            {overBalance && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label>Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <textarea
                            value={notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                            placeholder="Reason or additional details…"
                            rows={2}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || overBalance}>
                        {submitting ? 'Submitting…' : 'Submit Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

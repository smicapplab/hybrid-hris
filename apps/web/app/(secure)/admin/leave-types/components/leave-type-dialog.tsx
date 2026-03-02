'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { LeaveType } from '@/types/leave.types'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    initialData?: LeaveType | null
    onSuccessAction: () => void
}

export function LeaveTypeDialog({ open, onOpenChangeAction, initialData, onSuccessAction }: Props) {
    const { toast } = useToast()
    const isEdit = !!initialData

    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [description, setDescription] = useState('')
    const [isPaid, setIsPaid] = useState(true)
    const [isAccrualBased, setIsAccrualBased] = useState(true)
    const [accrualRatePerMonth, setAccrualRatePerMonth] = useState('')
    const [maxCarryOver, setMaxCarryOver] = useState('')
    const [loading, setLoading] = useState(false)
    const [touched, setTouched] = useState(false)

    useEffect(() => {
        if (initialData) {
            setName(initialData.name)
            setCode(initialData.code)
            setDescription(initialData.description ?? '')
            setIsPaid(initialData.isPaid)
            setIsAccrualBased(initialData.isAccrualBased)
            setAccrualRatePerMonth(initialData.accrualRatePerMonth ?? '')
            setMaxCarryOver(initialData.maxCarryOver ?? '')
        } else {
            setName('')
            setCode('')
            setDescription('')
            setIsPaid(true)
            setIsAccrualBased(true)
            setAccrualRatePerMonth('')
            setMaxCarryOver('')
        }
        setTouched(false)
    }, [initialData, open])

    const isValid = name.trim() && code.trim()

    async function handleSubmit() {
        setTouched(true)
        if (!isValid) return

        try {
            setLoading(true)

            const body: Record<string, unknown> = {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description.trim() || undefined,
                isPaid,
                isAccrualBased,
            }

            if (isAccrualBased) {
                if (accrualRatePerMonth) body.accrualRatePerMonth = accrualRatePerMonth
                if (maxCarryOver) body.maxCarryOver = maxCarryOver
            } else {
                body.accrualRatePerMonth = null
                body.maxCarryOver = null
            }

            if (isEdit) {
                await apiFetch(`/leave-types/${initialData!.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                })
                toast({ title: 'Leave type updated', variant: 'success' })
            } else {
                await apiFetch('/leave-types', {
                    method: 'POST',
                    body: JSON.stringify(body),
                })
                toast({ title: 'Leave type created', variant: 'success' })
            }

            onOpenChangeAction(false)
            onSuccessAction()
        } catch (err) {
            toast({
                title: isEdit ? 'Failed to update leave type' : 'Failed to create leave type',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Leave Type' : 'New Leave Type'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="lt-name">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="lt-name"
                            placeholder="e.g. Annual Leave"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={touched && !name.trim() ? 'border-destructive' : ''}
                        />
                        {touched && !name.trim() && (
                            <p className="text-xs text-destructive">Name is required.</p>
                        )}
                    </div>

                    {/* Code */}
                    <div className="space-y-1.5">
                        <Label htmlFor="lt-code">
                            Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="lt-code"
                            placeholder="e.g. AL"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className={`font-mono ${touched && !code.trim() ? 'border-destructive' : ''}`}
                        />
                        {touched && !code.trim() ? (
                            <p className="text-xs text-destructive">Code is required.</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">Unique identifier. Auto-uppercased.</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="lt-desc">Description</Label>
                        <textarea
                            id="lt-desc"
                            placeholder="Optional description…"
                            value={description}
                            onChange={(e: { target: { value: string } }) => setDescription(e.target.value)}
                            rows={2}
                            className="resize-none text-sm w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="lt-paid" className="text-sm cursor-pointer">Paid leave</Label>
                            <Switch id="lt-paid" checked={isPaid} onCheckedChange={setIsPaid} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="lt-accrual" className="text-sm cursor-pointer">Accrual-based</Label>
                            <Switch id="lt-accrual" checked={isAccrualBased} onCheckedChange={setIsAccrualBased} />
                        </div>
                    </div>

                    {/* Accrual fields — only shown when accrual-based */}
                    {isAccrualBased && (
                        <div className="grid grid-cols-2 gap-3 rounded-lg border border-dashed p-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="lt-rate" className="text-xs">Monthly Rate (days)</Label>
                                <Input
                                    id="lt-rate"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    placeholder="e.g. 1.25"
                                    value={accrualRatePerMonth}
                                    onChange={(e) => setAccrualRatePerMonth(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lt-carry" className="text-xs">Max Carry-Over (days)</Label>
                                <Input
                                    id="lt-carry"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="Unlimited if blank"
                                    value={maxCarryOver}
                                    onChange={(e) => setMaxCarryOver(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

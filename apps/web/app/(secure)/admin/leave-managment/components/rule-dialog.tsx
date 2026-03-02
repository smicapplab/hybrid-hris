'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { LeavePolicyRule, LeaveType } from '@/types/leave.types'

type AccrualMethod = 'MONTHLY' | 'ANNUAL_GRANT' | 'NONE'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    policyId: string
    initialData?: LeavePolicyRule | null
    onSuccessAction: () => void
}

export function RuleDialog({ open, onOpenChangeAction, policyId, initialData, onSuccessAction }: Props) {
    const { toast } = useToast()
    const isEdit = !!initialData

    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [leaveTypeId, setLeaveTypeId] = useState('')
    const [accrualMethod, setAccrualMethod] = useState<AccrualMethod>('NONE')
    const [accrualRatePerMonth, setAccrualRatePerMonth] = useState('')
    const [annualGrantAmount, setAnnualGrantAmount] = useState('')
    const [maxBalance, setMaxBalance] = useState('')
    const [maxCarryOver, setMaxCarryOver] = useState('')
    const [allowNegativeBalance, setAllowNegativeBalance] = useState(false)
    const [loading, setLoading] = useState(false)
    const [touched, setTouched] = useState(false)

    // Load leave types when dialog opens
    useEffect(() => {
        if (!open) return
        apiFetch<LeaveType[]>('/leave-types')
            .then(setLeaveTypes)
            .catch(() => {/* silent */})
    }, [open])

    useEffect(() => {
        if (initialData) {
            setLeaveTypeId(initialData.leaveTypeId)
            setAccrualMethod(initialData.accrualMethod)
            setAccrualRatePerMonth(initialData.accrualRatePerMonth ?? '')
            setAnnualGrantAmount(initialData.annualGrantAmount ?? '')
            setMaxBalance(initialData.maxBalance ?? '')
            setMaxCarryOver(initialData.maxCarryOver ?? '')
            setAllowNegativeBalance(initialData.allowNegativeBalance)
        } else {
            setLeaveTypeId('')
            setAccrualMethod('NONE')
            setAccrualRatePerMonth('')
            setAnnualGrantAmount('')
            setMaxBalance('')
            setMaxCarryOver('')
            setAllowNegativeBalance(false)
        }
        setTouched(false)
    }, [initialData, open])

    const methodErrors = () => {
        if (accrualMethod === 'MONTHLY' && !accrualRatePerMonth) return 'Monthly rate is required.'
        if (accrualMethod === 'ANNUAL_GRANT' && !annualGrantAmount) return 'Annual grant amount is required.'
        return null
    }

    const isValid = (!isEdit && leaveTypeId) || isEdit

    async function handleSubmit() {
        setTouched(true)
        if (!isValid || methodErrors()) return

        try {
            setLoading(true)

            const body: Record<string, unknown> = {
                accrualMethod,
                accrualRatePerMonth: accrualMethod === 'MONTHLY' ? accrualRatePerMonth : null,
                annualGrantAmount: accrualMethod === 'ANNUAL_GRANT' ? annualGrantAmount : null,
                maxBalance: maxBalance || null,
                maxCarryOver: maxCarryOver || null,
                allowNegativeBalance,
            }

            if (isEdit) {
                await apiFetch(`/leave-policies/${policyId}/rules/${initialData!.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                })
                toast({ title: 'Rule updated', variant: 'success' })
            } else {
                await apiFetch(`/leave-policies/${policyId}/rules`, {
                    method: 'POST',
                    body: JSON.stringify({ ...body, leaveTypeId }),
                })
                toast({ title: 'Rule added', variant: 'success' })
            }

            onOpenChangeAction(false)
            onSuccessAction()
        } catch (err) {
            toast({
                title: isEdit ? 'Failed to update rule' : 'Failed to add rule',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Rule' : 'Add Leave Rule'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Leave Type — only on create */}
                    {!isEdit && (
                        <div className="space-y-1.5">
                            <Label>Leave Type <span className="text-destructive">*</span></Label>
                            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                                <SelectTrigger className={touched && !leaveTypeId ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Select a leave type…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map((lt) => (
                                        <SelectItem key={lt.id} value={lt.id}>
                                            <span className="font-medium">{lt.name}</span>
                                            <span className="text-muted-foreground ml-1 text-xs font-mono">({lt.code})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {touched && !leaveTypeId && <p className="text-xs text-destructive">Leave type is required.</p>}
                        </div>
                    )}

                    {/* Accrual Method */}
                    <div className="space-y-1.5">
                        <Label>Accrual Method <span className="text-destructive">*</span></Label>
                        <Select value={accrualMethod} onValueChange={(v) => setAccrualMethod(v as AccrualMethod)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="ANNUAL_GRANT">Annual Grant</SelectItem>
                                <SelectItem value="NONE">None (manual)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Conditional rate / grant */}
                    {accrualMethod === 'MONTHLY' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="rule-rate">Monthly Rate (days) <span className="text-destructive">*</span></Label>
                            <Input
                                id="rule-rate"
                                type="number"
                                step="0.25"
                                min="0"
                                placeholder="e.g. 1.25"
                                value={accrualRatePerMonth}
                                onChange={(e) => setAccrualRatePerMonth(e.target.value)}
                                className={touched && !accrualRatePerMonth ? 'border-destructive' : ''}
                            />
                            {touched && !accrualRatePerMonth && <p className="text-xs text-destructive">Required for monthly accrual.</p>}
                        </div>
                    )}

                    {accrualMethod === 'ANNUAL_GRANT' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="rule-grant">Annual Grant (days) <span className="text-destructive">*</span></Label>
                            <Input
                                id="rule-grant"
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="e.g. 15"
                                value={annualGrantAmount}
                                onChange={(e) => setAnnualGrantAmount(e.target.value)}
                                className={touched && !annualGrantAmount ? 'border-destructive' : ''}
                            />
                            {touched && !annualGrantAmount && <p className="text-xs text-destructive">Required for annual grant.</p>}
                        </div>
                    )}

                    {/* Optional limits */}
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-dashed p-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="rule-maxbal" className="text-xs">Max Balance (days)</Label>
                            <Input
                                id="rule-maxbal"
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="Unlimited"
                                value={maxBalance}
                                onChange={(e) => setMaxBalance(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="rule-carry" className="text-xs">Max Carry-Over (days)</Label>
                            <Input
                                id="rule-carry"
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="Unlimited"
                                value={maxCarryOver}
                                onChange={(e) => setMaxCarryOver(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* Allow negative */}
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                        <Label htmlFor="rule-neg" className="text-sm cursor-pointer">Allow negative balance</Label>
                        <Switch id="rule-neg" checked={allowNegativeBalance} onCheckedChange={setAllowNegativeBalance} />
                    </div>
                </div>

                <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving…' : isEdit ? 'Update' : 'Add Rule'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

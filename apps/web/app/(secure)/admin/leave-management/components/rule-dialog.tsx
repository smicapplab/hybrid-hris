'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { NumericInput } from '@/components/ui/numeric-input'
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
    const [accrualRatePerMonth, setAccrualRatePerMonth] = useState<number>(0)
    const [annualGrantAmount, setAnnualGrantAmount] = useState<number>(0)
    const [maxBalance, setMaxBalance] = useState<number>(0)
    const [maxCarryOver, setMaxCarryOver] = useState<number>(0)
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
            setAccrualRatePerMonth(initialData.accrualRatePerMonth ? parseFloat(initialData.accrualRatePerMonth) : 0)
            setAnnualGrantAmount(initialData.annualGrantAmount ? parseFloat(initialData.annualGrantAmount) : 0)
            setMaxBalance(initialData.maxBalance ? parseFloat(initialData.maxBalance) : 0)
            setMaxCarryOver(initialData.maxCarryOver ? parseFloat(initialData.maxCarryOver) : 0)
            setAllowNegativeBalance(initialData.allowNegativeBalance)
        } else {
            setLeaveTypeId('')
            setAccrualMethod('NONE')
            setAccrualRatePerMonth(0)
            setAnnualGrantAmount(0)
            setMaxBalance(0)
            setMaxCarryOver(0)
            setAllowNegativeBalance(false)
        }
        setTouched(false)
    }, [initialData, open])

    const methodErrors = () => {
        if (accrualMethod === 'MONTHLY' && accrualRatePerMonth <= 0) return 'Monthly rate is required.'
        if (accrualMethod === 'ANNUAL_GRANT' && annualGrantAmount <= 0) return 'Annual grant amount is required.'
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
                accrualRatePerMonth: accrualMethod === 'MONTHLY' ? accrualRatePerMonth.toString() : null,
                annualGrantAmount: accrualMethod === 'ANNUAL_GRANT' ? annualGrantAmount.toString() : null,
                maxBalance: maxBalance > 0 ? maxBalance.toString() : null,
                maxCarryOver: maxCarryOver > 0 ? maxCarryOver.toString() : null,
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
                            <NumericInput
                                id="rule-rate"
                                mode="float"
                                precision={2}
                                min={0}
                                placeholder="e.g. 1.25"
                                value={accrualRatePerMonth}
                                onChangeAction={setAccrualRatePerMonth}
                                className={touched && accrualRatePerMonth <= 0 ? 'border-destructive' : ''}
                            />
                            {touched && accrualRatePerMonth <= 0 && <p className="text-xs text-destructive">Required for monthly accrual.</p>}
                        </div>
                    )}

                    {accrualMethod === 'ANNUAL_GRANT' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="rule-grant">Annual Grant (days) <span className="text-destructive">*</span></Label>
                            <NumericInput
                                id="rule-grant"
                                mode="float"
                                precision={1}
                                min={0}
                                placeholder="e.g. 15"
                                value={annualGrantAmount}
                                onChangeAction={setAnnualGrantAmount}
                                className={touched && annualGrantAmount <= 0 ? 'border-destructive' : ''}
                            />
                            {touched && annualGrantAmount <= 0 && <p className="text-xs text-destructive">Required for annual grant.</p>}
                        </div>
                    )}

                    {/* Optional limits */}
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-dashed p-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="rule-maxbal" className="text-xs">Max Balance (days)</Label>
                            <NumericInput
                                id="rule-maxbal"
                                mode="float"
                                precision={1}
                                min={0}
                                placeholder="Unlimited"
                                value={maxBalance}
                                onChangeAction={setMaxBalance}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="rule-carry" className="text-xs">Max Carry-Over (days)</Label>
                            <NumericInput
                                id="rule-carry"
                                mode="float"
                                precision={1}
                                min={0}
                                placeholder="Unlimited"
                                value={maxCarryOver}
                                onChangeAction={setMaxCarryOver}
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

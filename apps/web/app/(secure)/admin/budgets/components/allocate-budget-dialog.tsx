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
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { ExpenseCategory, BudgetPeriod } from '@/types/expense.types'
import { Loader2 } from 'lucide-react'
import { OrgUnit } from '@hybrid-hris/db/types'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: ExpenseCategory[]
    periods: BudgetPeriod[]
    orgUnits: OrgUnit[]
    onSuccess: () => void
}

export function AllocateBudgetDialog({ open, onOpenChange, categories, periods, orgUnits, onSuccess }: Props) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const [unitId, setUnitId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [periodId, setPeriodId] = useState('')
    const [amount, setAmount] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!unitId || !categoryId || !periodId || !amount) {
            toast({ title: 'Please fill in all required fields', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            await apiFetch('/budgets/allocate', {
                method: 'POST',
                body: JSON.stringify({
                    orgUnitId: unitId,
                    expenseCategoryId: categoryId,
                    budgetPeriodId: periodId,
                    amount,
                })
            })

            toast({ title: 'Budget allocated successfully', variant: 'success' })
            onSuccess()
            onOpenChange(false)
            // Reset form partially
            setAmount('')
        } catch (err) {
            toast({
                title: 'Allocation failed',
                description: err instanceof Error ? err.message : 'Please try again',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Allocate Team Budget</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="unit">Organizational Unit</Label>
                            <Select value={unitId} onValueChange={setUnitId}>
                                <SelectTrigger id="unit">
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orgUnits.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="period">Budget Period</Label>
                            <Select value={periodId} onValueChange={setPeriodId}>
                                <SelectTrigger id="period">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Budget Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Set Allocation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

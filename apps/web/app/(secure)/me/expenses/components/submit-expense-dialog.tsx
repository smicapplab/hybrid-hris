'use client'

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
import { NumericInput } from '@/components/ui/numeric-input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { ExpenseCategory, BudgetPeriod } from '@/types/expense.types'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { OrgUnit } from '@hybrid-hris/db/types'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    categories: ExpenseCategory[]
    periods: BudgetPeriod[]
    onSuccessAction: () => void
}

export function SubmitExpenseDialog({ open, onOpenChangeAction, categories, periods, onSuccessAction }: Props) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])

    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
    const [categoryId, setCategoryId] = useState('')
    const [periodId, setPeriodId] = useState('')
    const [orgUnitId, setOrgUnitId] = useState('')
    const [amount, setAmount] = useState<number>(0)
    const [description, setDescription] = useState('')

    useEffect(() => {
        if (open) {
            // Fetch active leaf org units (those that can have budgets)
            apiFetch<OrgUnit[]>('/org-units?leavesOnly=true').then(data => {
                setOrgUnits(data ?? [])
                // If user has a default org unit and it's in the list, select it
                if (user?.orgUnitId) {
                    setOrgUnitId(user.orgUnitId)
                }
            })
        }
    }, [open, user?.orgUnitId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!categoryId || !periodId || amount <= 0 || !description || !orgUnitId) {
            toast({ title: 'Please fill in all required fields', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            await apiFetch('/expense-claims', {
                method: 'POST',
                body: JSON.stringify({
                    expenseDate,
                    expenseCategoryId: categoryId,
                    budgetPeriodId: periodId,
                    orgUnitId,
                    amount: amount.toString(),
                    description,
                })
            })

            toast({ title: 'Expense claim submitted', variant: 'success' })
            onSuccessAction()
            onOpenChangeAction(false)
            // Reset form
            setCategoryId('')
            setPeriodId('')
            setAmount(0)
            setDescription('')
        } catch (err) {
            toast({
                title: 'Submission failed',
                description: err instanceof Error ? err.message : 'Please try again',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-106.25">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>File New Expense</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="unit">Charge to Team</Label>
                            <Select value={orgUnitId} onValueChange={setOrgUnitId}>
                                <SelectTrigger id="unit">
                                    <SelectValue placeholder="Select team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orgUnits.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="date">Expense Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                required
                            />
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
                            <Label htmlFor="amount">Amount</Label>
                            <NumericInput
                                id="amount"
                                mode="float"
                                placeholder="0.00"
                                value={amount}
                                onChangeAction={setAmount}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="desc">Description</Label>
                            <Textarea
                                id="desc"
                                placeholder="What was this expense for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Claim
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

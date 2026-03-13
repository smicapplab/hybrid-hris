'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { ExpenseClaim, ExpenseCategory, BudgetPeriod } from '@/types/expense.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, AlertTriangle, Receipt, Wallet } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

type PendingClaimItem = {
    claim: ExpenseClaim;
    employee: {
        firstName: string;
        lastName: string;
    };
}

export default function ExpenseApprovalsPage() {
    const { toast } = useToast()
    const [items, setItems] = useState<PendingClaimItem[]>([])
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [periods, setPeriods] = useState<BudgetPeriod[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [budgets, setBudgets] = useState<Record<string, number>>({})

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [pendingData, catsData, periodsData] = await Promise.all([
                apiFetch<PendingClaimItem[]>('/expense-claims/pending'),
                apiFetch<ExpenseCategory[]>('/expenses-metadata/categories'),
                apiFetch<BudgetPeriod[]>('/expenses-metadata/periods'),
            ])
            setItems(pendingData ?? [])
            setCategories(catsData ?? [])
            setPeriods(periodsData ?? [])

            // Load balances for each unique category/org/period combo
            const budgetMap: Record<string, number> = {}
            if (pendingData) {
                for (const item of pendingData) {
                    const key = `${item.claim.orgUnitId}-${item.claim.budgetPeriodId}-${item.claim.expenseCategoryId}`
                    if (!(key in budgetMap)) {
                        const res = await apiFetch<{ balance: number }>(
                            `/budgets/remaining?orgUnitId=${item.claim.orgUnitId}&budgetPeriodId=${item.claim.budgetPeriodId}&expenseCategoryId=${item.claim.expenseCategoryId}`
                        )
                        budgetMap[key] = res?.balance ?? 0
                    }
                }
            }
            setBudgets(budgetMap)
        } catch (error) {
            console.error('Failed to load pending expenses:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleApprove = async (claimId: string) => {
        setActionLoading(claimId)
        try {
            await apiFetch(`/expense-claims/${claimId}/approve`, {
                method: 'POST',
                body: JSON.stringify({ level: 2, remarks: 'Approved by manager' }) // Level 2 is final for MVP
            })
            toast({ title: 'Expense approved', variant: 'success' })
            loadData()
        } catch (err) {
            toast({
                title: 'Approval failed',
                description: err instanceof Error ? err.message : 'An unknown error occurred',
                variant: 'destructive'
            })
        } finally {
            setActionLoading(null)
        }
    }

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? 'Unknown'
    const getPeriodName = (id: string) => periods.find(p => p.id === id)?.name ?? 'Unknown'

    const getRemaining = (item: PendingClaimItem) => {
        const key = `${item.claim.orgUnitId}-${item.claim.budgetPeriodId}-${item.claim.expenseCategoryId}`
        return budgets[key] ?? 0
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-blue-900">Expense Approvals</h1>
                <p className="text-muted-foreground">Review and approve team expense claims.</p>
            </div>

            <Card>
                <CardHeader className="bg-zinc-50/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-blue-600" />
                        Pending Claims Queue
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Employee</TableHead>
                                <TableHead>Expense Details</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Budget Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                        Loading queue...
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No pending expense claims to approve.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const remaining = getRemaining(item)
                                    const requested = parseFloat(item.claim.amount)
                                    const isOverBudget = requested > remaining

                                    return (
                                        <TableRow key={item.claim.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="font-semibold">{item.employee.firstName} {item.employee.lastName}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">Submitted {format(new Date(item.claim.submittedAt!), 'MMM dd')}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-medium">{getCategoryName(item.claim.expenseCategoryId)}</div>
                                                <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-50">{item.claim.description}</div>
                                                <div className="text-[10px] text-blue-600 font-medium mt-1 uppercase tracking-tighter">{getPeriodName(item.claim.budgetPeriodId)}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                {requested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Wallet className="w-3 h-3 text-zinc-400" />
                                                        <span className={`text-[11px] font-medium ${isOverBudget ? 'text-rose-600' : 'text-zinc-600'}`}>
                                                            {remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} left
                                                        </span>
                                                    </div>
                                                    {isOverBudget && (
                                                        <div className="flex items-center gap-1 text-[9px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded w-fit uppercase">
                                                            <AlertTriangle className="w-2.5 h-2.5" />
                                                            Over Budget
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 text-white hover:text-rose-700 bg-rose-500 hover:bg-rose-50"
                                                        disabled={!!actionLoading}
                                                    >
                                                        <X className="w-4 h-4" /> Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-50 gap-1.5 hover:text-emerald-700"
                                                        onClick={() => handleApprove(item.claim.id)}
                                                        disabled={!!actionLoading}
                                                    >
                                                        {actionLoading === item.claim.id ? (
                                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                        Approve
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

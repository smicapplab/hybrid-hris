'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { ExpenseClaim, ExpenseCategory, BudgetPeriod } from '@/types/expense.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Receipt, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { SubmitExpenseDialog } from './components/submit-expense-dialog'

export default function MyExpensesPage() {
    const [claims, setClaims] = useState<ExpenseClaim[]>([])
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [periods, setPeriods] = useState<BudgetPeriod[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [claimsData, catsData, periodsData] = await Promise.all([
                apiFetch<ExpenseClaim[]>('/expense-claims/me'),
                apiFetch<ExpenseCategory[]>('/expenses-metadata/categories'),
                apiFetch<BudgetPeriod[]>('/expenses-metadata/periods'),
            ])
            setClaims(claimsData ?? [])
            setCategories(catsData ?? [])
            setPeriods(periodsData ?? [])
        } catch (error) {
            console.error('Failed to load expense data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return <Clock className="w-4 h-4 text-amber-500" />
            case 'APPROVED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case 'REJECTED': return <XCircle className="w-4 h-4 text-rose-500" />
            case 'REIMBURSED': return <Receipt className="w-4 h-4 text-blue-500" />
            default: return <AlertCircle className="w-4 h-4 text-zinc-400" />
        }
    }

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? 'Unknown'

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Expenses</h1>
                    <p className="text-muted-foreground">Manage and track your expense claims.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> File Expense
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {claims.filter(c => c.status === 'SUBMITTED').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved this Month</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {claims.filter(c => c.status === 'APPROVED' || c.status === 'REIMBURSED').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Claims</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                        Loading expenses...
                                    </TableCell>
                                </TableRow>
                            ) : claims.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No expense claims found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                claims.map((claim) => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(claim.expenseDate), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell>{getCategoryName(claim.expenseCategoryId)}</TableCell>
                                        <TableCell className="max-w-[300px] truncate">{claim.description}</TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {parseFloat(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(claim.status)}
                                                <span className="text-xs font-medium capitalize">
                                                    {claim.status.toLowerCase()}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <SubmitExpenseDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                categories={categories}
                periods={periods}
                onSuccess={loadData}
            />
        </div>
    )
}

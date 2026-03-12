'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { ExpenseCategory, BudgetPeriod, OrgUnitBudget } from '@/types/expense.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Building2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AllocateBudgetDialog } from './components/allocate-budget-dialog'
import { OrgUnit } from '@hybrid-hris/db/types'

export default function AdminBudgetsPage() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [periods, setPeriods] = useState<BudgetPeriod[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [budgets, setBudgets] = useState<OrgUnitBudget[]>([])

    const [selectedPeriod, setSelectedPeriod] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [catsData, periodsData, orgsData] = await Promise.all([
                apiFetch<ExpenseCategory[]>('/expenses-metadata/categories'),
                apiFetch<BudgetPeriod[]>('/expenses-metadata/periods'),
                apiFetch<OrgUnit[]>('/org-units'),
            ])
            setCategories(catsData ?? [])
            setPeriods(periodsData ?? [])
            setOrgUnits(orgsData ?? [])

            if (periodsData?.length > 0 && !selectedPeriod) {
                setSelectedPeriod(periodsData[0].id)
            }
        } catch (error) {
            console.error('Failed to load budget metadata:', error)
        } finally {
            setLoading(false)
        }
    }, [selectedPeriod])

    const loadBudgets = useCallback(async () => {
        if (!selectedPeriod) return
        try {
            const data = await apiFetch<OrgUnitBudget[]>(`/budgets?budgetPeriodId=${selectedPeriod}`)
            setBudgets(data ?? [])
        } catch (error) {
            console.error('Failed to load budgets:', error)
        }
    }, [selectedPeriod])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        loadBudgets()
    }, [loadBudgets])

    const getBudgetValue = (orgUnitId: string, categoryId: string) => {
        return budgets.find(b => b.orgUnitId === orgUnitId && b.expenseCategoryId === categoryId)?.amountAllocated ?? '0.00'
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team Budgets</h1>
                    <p className="text-muted-foreground">Allocate and track budgets across organizational units.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-50">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                        <Target className="w-4 h-4" /> Allocate Budget
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        Budget Matrix
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-62.5 font-bold">Organizational Unit</TableHead>
                                    {categories.map(cat => (
                                        <TableHead key={cat.id} className="text-right font-bold min-w-30">
                                            {cat.name}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right font-bold bg-muted/30">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={categories.length + 2} className="text-center py-10 text-muted-foreground italic">
                                            Loading budget data...
                                        </TableCell>
                                    </TableRow>
                                ) : orgUnits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={categories.length + 2} className="text-center py-10">
                                            No organizational units found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orgUnits.map((unit) => {
                                        let unitTotal = 0
                                        return (
                                            <TableRow key={unit.id} className="hover:bg-muted/20">
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{unit.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono uppercase">{unit.code}</span>
                                                    </div>
                                                </TableCell>
                                                {categories.map(cat => {
                                                    const val = parseFloat(getBudgetValue(unit.id, cat.id))
                                                    unitTotal += val
                                                    return (
                                                        <TableCell key={cat.id} className="text-right font-mono text-xs">
                                                            {val > 0 ? val.toLocaleString('en-US', { minimumFractionDigits: 2 }) : <span className="text-zinc-300">0.00</span>}
                                                        </TableCell>
                                                    )
                                                })}
                                                <TableCell className="text-right font-mono font-bold bg-muted/10">
                                                    {unitTotal > 0 ? unitTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AllocateBudgetDialog
                open={isDialogOpen}
                onOpenChangeAction={setIsDialogOpen}
                categories={categories}
                periods={periods}
                orgUnits={orgUnits}
                onSuccessAction={loadBudgets}
            />
        </div>
    )
}

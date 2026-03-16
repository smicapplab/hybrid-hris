'use client'

import { Sailboat, Pencil, PowerOff, Power, Plus, Trash2, Edit2, CalendarRange, Star, Users, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import type { LeavePolicyWithRules, LeavePolicyRule } from '@/types/leave.types'
import type { Employee } from '@/types/employee.type'
import Link from 'next/link'

type Props = {
    policy: LeavePolicyWithRules
    onEditPolicyAction: () => void
    onToggleActiveAction: () => void
    onSetDefaultAction: () => void
    onAddRuleAction: () => void
    onEditRuleAction: (rule: LeavePolicyRule) => void
    onRemoveRuleAction: (ruleId: string) => void
}

const ACCRUAL_LABELS: Record<string, string> = {
    MONTHLY: 'Monthly',
    ANNUAL_GRANT: 'Annual Grant',
    NONE: 'None',
}

const ACCRUAL_COLORS: Record<string, string> = {
    MONTHLY: 'bg-violet-50 text-violet-600',
    ANNUAL_GRANT: 'bg-blue-50 text-blue-600',
    NONE: 'bg-zinc-100 text-zinc-500',
}

export function PolicyDetailPanel({
    policy,
    onEditPolicyAction,
    onToggleActiveAction,
    onSetDefaultAction,
    onAddRuleAction,
    onEditRuleAction,
    onRemoveRuleAction,
}: Props) {
    const isInactive = !policy.isActive

    // ── Employees state ──────────────────────────────────────────────────────────
    const [employeesList, setEmployeesList] = useState<Employee[]>([])
    const [totalEmployees, setTotalEmployees] = useState(0)
    const [loadingEmployees, setLoadingEmployees] = useState(false)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const limit = 10

    const loadEmployees = useCallback(async () => {
        try {
            setLoadingEmployees(true)
            const params = new URLSearchParams()
            params.append('page', page.toString())
            params.append('limit', limit.toString())
            if (search) params.append('search', search)

            const result = await apiFetch<{ items: Employee[], total: number }>(`/leave-policies/${policy.id}/employees?${params.toString()}`)
            setEmployeesList(result.items)
            setTotalEmployees(result.total)
        } catch (err) {
            console.error('Failed to load employees for policy:', err)
            setEmployeesList([])
            setTotalEmployees(0)
        } finally {
            setLoadingEmployees(false)
        }
    }, [policy.id, page, search])

    useEffect(() => {
        setPage(1)
    }, [policy.id])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadEmployees()
        }, 300)
        return () => clearTimeout(timer)
    }, [loadEmployees])

    function fmt(d: string | null | undefined) {
        if (!d) return '—'
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    function fmtNum(v: string | null | undefined) {
        if (!v) return '—'
        return `${parseFloat(v)} days`
    }

    const totalPages = Math.ceil(totalEmployees / limit)

    return (
        <div className="space-y-6">
            {/* Policy header card */}
            <div className={`rounded-xl border p-5 bg-linear-to-br ${isInactive ? 'from-zinc-50 to-zinc-100/60' : 'from-card to-muted/20'}`}>
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                        ${isInactive ? 'bg-zinc-200 text-zinc-400' : 'bg-blue-100 text-blue-700'}`}>
                        <Sailboat className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-semibold">{policy.name}</h2>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                                ${policy.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                {policy.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {policy.isDefault && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600">
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted border rounded px-1.5 py-0.5 shadow-sm font-mono">
                                {policy.code}
                            </code>
                        </div>
                    </div>
                </div>

                {/* Effective dates */}
                <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarRange className="w-3.5 h-3.5 shrink-0" />
                    <span>
                        Effective: <span className="font-medium text-foreground">{fmt(policy.effectiveFrom)}</span>
                        {policy.effectiveTo
                            ? <> → <span className="font-medium text-foreground">{fmt(policy.effectiveTo)}</span></>
                            : <span className="text-muted-foreground"> → ongoing</span>
                        }
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={onEditPolicyAction}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    {!policy.isDefault && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 hover:text-amber-700" onClick={onSetDefaultAction}>
                            <Star className="w-3.5 h-3.5" /> Set as Default
                        </Button>
                    )}
                    {policy.isActive ? (
                        <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={onToggleActiveAction}>
                            <PowerOff className="w-3.5 h-3.5" /> Deactivate
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 hover:text-emerald-700" onClick={onToggleActiveAction}>
                            <Power className="w-3.5 h-3.5" /> Activate
                        </Button>
                    )}
                </div>
            </div>

            {/* Description */}
            {policy.description && (
                <div className="rounded-xl border p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{policy.description}</p>
                </div>
            )}

            {/* Rules */}
            <div className="rounded-xl border">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div>
                        <h3 className="text-sm font-semibold">Leave Rules</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''} configured
                        </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={onAddRuleAction}>
                        <Plus className="w-3.5 h-3.5" /> Add Rule
                    </Button>
                </div>

                {policy.rules.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground">
                        No rules yet. Add a rule to configure leave entitlements.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Leave Type</th>
                                    <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Accrual</th>
                                    <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rate / Grant</th>
                                    <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Max Balance</th>
                                    <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Max Carry-Over</th>
                                    <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Regular Only?</th>
                                    <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Neg.</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {policy.rules.map((rule) => (
                                    <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-xs">{rule.leaveTypeName ?? '—'}</p>
                                            <p className="text-[11px] text-muted-foreground font-mono">{rule.leaveTypeCode}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${ACCRUAL_COLORS[rule.accrualMethod]}`}>
                                                {ACCRUAL_LABELS[rule.accrualMethod]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {rule.accrualMethod === 'MONTHLY' && fmtNum(rule.accrualRatePerMonth)}
                                            {rule.accrualMethod === 'ANNUAL_GRANT' && fmtNum(rule.annualGrantAmount)}
                                            {rule.accrualMethod === 'NONE' && <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{fmtNum(rule.maxBalance)}</td>
                                        <td className="px-4 py-3 text-xs">{fmtNum(rule.maxCarryOver)}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {rule.isRegularOnly
                                                ? <span className="text-blue-600 font-medium">Yes</span>
                                                : <span className="text-muted-foreground">No</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {rule.allowNegativeBalance
                                                ? <span className="text-emerald-600 font-medium">Yes</span>
                                                : <span className="text-muted-foreground">No</span>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => onEditRuleAction(rule)}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => onRemoveRuleAction(rule.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Employees Section */}
            <div className="rounded-xl border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/10">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <h3 className="text-sm font-semibold">Assigned Employees</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''} currently under this policy
                            </p>
                        </div>
                    </div>
                    <div className="relative w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs"
                        />
                    </div>
                </div>

                <div className="min-h-50">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="w-25 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground pl-4">ID</TableHead>
                                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hire Date</TableHead>
                                <TableHead className="w-12.5 pr-4"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingEmployees && employeesList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs italic">
                                        Loading employees...
                                    </TableCell>
                                </TableRow>
                            ) : employeesList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                                        No employees found under this policy.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employeesList.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell className="font-mono text-[11px] pl-4">{emp.employeeNo}</TableCell>
                                        <TableCell className="text-xs font-medium">{emp.firstName} {emp.lastName}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 capitalize">
                                                {emp.status.toLowerCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-[11px] text-muted-foreground">{fmt(emp.hireDate)}</TableCell>
                                        <TableCell className="pr-4">
                                            <Link href={`/people/employees/${emp.id}`}>
                                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/5">
                        <p className="text-[10px] text-muted-foreground">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-0.5">Created</p>
                    <p className="text-xs">{new Date(policy.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-0.5">Last Updated</p>
                    <p className="text-xs">{new Date(policy.updatedAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    )
}

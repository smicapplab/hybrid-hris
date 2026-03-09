'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { AsyncSearchSelect } from '@/components/ui/async-search-select'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import type { SupervisorOption } from '@/types/employee.type'

/* ─── Types ───────────────────────────────────────────────────────────────── */

type LeaderRole = 'HEAD' | 'CO_HEAD' | 'ACTING_HEAD'

type Leader = {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    role: LeaderRole
    isPrimary: boolean
    effectiveFrom: string
    effectiveTo: string | null
}

/* ─── Role display config ─────────────────────────────────────────────────── */

const ROLE_LABELS: Record<LeaderRole, string> = {
    HEAD: 'Head',
    CO_HEAD: 'Co-Head',
    ACTING_HEAD: 'Acting Head',
}

const ROLE_CLASSES: Record<LeaderRole, string> = {
    HEAD: 'bg-blue-50 text-blue-700 border border-blue-200',
    CO_HEAD: 'bg-violet-50 text-violet-700 border border-violet-200',
    ACTING_HEAD: 'bg-amber-50 text-amber-700 border border-amber-200',
}

/* ─── Component ───────────────────────────────────────────────────────────── */

interface Props {
    orgId: string
    onChangeAction?: () => void
}

export function OrgLeadersTable({ orgId, onChangeAction }: Props) {
    const { toast } = useToast()

    const [leaders, setLeaders] = useState<Leader[]>([])
    const [loading, setLoading] = useState(true)
    const [removeId, setRemoveId] = useState<string | null>(null)
    const [openAdd, setOpenAdd] = useState(false)

    /* ── Form state ── */
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
    const [role, setRole] = useState<LeaderRole>('HEAD')
    const [effectiveFrom, setEffectiveFrom] = useState(
        () => new Date().toISOString().split('T')[0],
    )
    const [isPrimary, setIsPrimary] = useState(false)
    const [saving, setSaving] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const data = await apiFetch<Leader[]>(`/org-units/${orgId}/leaders`)
            setLeaders(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (orgId) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId])

    function resetForm() {
        setSelectedEmployeeId(null)
        setRole('HEAD')
        setEffectiveFrom(new Date().toISOString().split('T')[0])
        setIsPrimary(false)
    }

    async function handleAdd() {
        if (!selectedEmployeeId) return
        setSaving(true)
        try {
            await apiFetch(`/org-units/${orgId}/leaders`, {
                method: 'POST',
                body: JSON.stringify({ employeeId: selectedEmployeeId, role, effectiveFrom, isPrimary }),
            })
            setOpenAdd(false)
            resetForm()
            await load()
            onChangeAction?.()
            toast({ title: 'Leader assigned', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to assign leader',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemove(leaderId: string) {
        try {
            await apiFetch(`/org-units/${orgId}/leaders/${leaderId}`, { method: 'DELETE' })
            setRemoveId(null)
            await load()
            onChangeAction?.()
            toast({ title: 'Leader removed', variant: 'success' })
        } catch (err) {
            setRemoveId(null)
            toast({
                title: 'Failed to remove leader',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground py-1">Loading leadership…</div>
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Leadership</p>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setOpenAdd(true)}
                >
                    + Assign Leader
                </Button>
            </div>

            {leaders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leaders assigned yet.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Since</TableHead>
                            <TableHead className="w-20 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaders.map((leader) => (
                            <TableRow key={leader.id}>
                                <TableCell className="font-medium">
                                    {leader.firstName} {leader.lastName}
                                    {leader.isPrimary && (
                                        <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                                            Primary
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_CLASSES[leader.role]}`}>
                                        {ROLE_LABELS[leader.role]}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(leader.effectiveFrom), 'PP')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setRemoveId(leader.id)}
                                    >
                                        Remove
                                    </Button>

                                    <AlertDialog
                                        open={removeId === leader.id}
                                        onOpenChange={(open) => !open && setRemoveId(null)}
                                    >
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remove Leader?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will remove{' '}
                                                    <strong>
                                                        {leader.firstName} {leader.lastName}
                                                    </strong>{' '}
                                                    as {ROLE_LABELS[leader.role]} of this unit.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemove(leader.id)}>
                                                    Confirm
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* ── Assign Leader Dialog ── */}
            <Dialog
                open={openAdd}
                onOpenChange={(v) => {
                    setOpenAdd(v)
                    if (!v) resetForm()
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Leader</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Employee search — same pattern as supervisor assignment */}
                        <AsyncSearchSelect<SupervisorOption>
                            label="Search Employee"
                            value={selectedEmployeeId}
                            onChangeAction={setSelectedEmployeeId}
                            fetchOptions={async (search) => {
                                const res = await apiFetch<{ data: SupervisorOption[] }>(
                                    `/employees?status=ACTIVE&search=${encodeURIComponent(search)}&pageSize=20`,
                                )
                                return res.data
                            }}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) => `${o.firstName} ${o.lastName}${o.employeeNo ? ` · ${o.employeeNo}` : ''}`}
                            placeholder="Search employee…"
                        />

                        {/* Role */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as LeaderRole)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="HEAD">Head</option>
                                <option value="CO_HEAD">Co-Head</option>
                                <option value="ACTING_HEAD">Acting Head</option>
                            </select>
                        </div>

                        {/* Effective From */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Effective From</label>
                            <input
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Primary flag */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="isPrimary"
                                checked={isPrimary}
                                onCheckedChange={(v) => setIsPrimary(!!v)}
                            />
                            <label htmlFor="isPrimary" className="text-sm cursor-pointer">
                                Mark as primary leader
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenAdd(false)
                                resetForm()
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={!selectedEmployeeId || saving}>
                            {saving ? 'Assigning…' : 'Assign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

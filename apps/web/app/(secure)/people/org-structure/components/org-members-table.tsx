'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
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
import { EMPLOYEE_STATUS_BADGE } from '@/lib/employee.enum'
import { useToast } from '@/hooks/use-toast'
import type { SupervisorOption } from '@/types/employee.type'
import { Pencil, UserRound } from 'lucide-react'

/* ─── Types ───────────────────────────────────────────────────────────────── */

type OrgMember = {
    id: string
    employeeNo: string | null
    firstName: string
    lastName: string
    status: string
    positionTitle: string | null
    supervisorId: string | null
    supervisorFirstName: string | null
    supervisorLastName: string | null
}

/* ─── Component ───────────────────────────────────────────────────────────── */

interface Props {
    orgId: string
    onChangeAction?: () => void
}

export function OrgMembersTable({ orgId, onChangeAction }: Props) {
    const { toast } = useToast()

    const [members, setMembers] = useState<OrgMember[]>([])
    const [loading, setLoading] = useState(true)

    // Remove confirmation
    const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null)

    // Add member dialog
    const [openAdd, setOpenAdd] = useState(false)
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Change supervisor dialog
    const [supTarget, setSupTarget] = useState<OrgMember | null>(null)
    const [newSupervisorId, setNewSupervisorId] = useState<string | null>(null)
    const [savingSup, setSavingSup] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const data = await apiFetch<OrgMember[]>(`/org-units/${orgId}/members`)
            setMembers(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (orgId) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId])

    /* ── Handlers ── */

    async function handleAdd() {
        if (!selectedEmployeeId) return
        setSaving(true)
        try {
            await apiFetch(`/employees/${selectedEmployeeId}`, {
                method: 'PATCH',
                body: JSON.stringify({ orgUnitId: orgId }),
            })
            setOpenAdd(false)
            setSelectedEmployeeId(null)
            await load()
            onChangeAction?.()
            toast({ title: 'Member added', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to add member',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemove(member: OrgMember) {
        try {
            await apiFetch(`/employees/${member.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ orgUnitId: null }),
            })
            setRemoveTarget(null)
            await load()
            onChangeAction?.()
            toast({ title: 'Member removed', variant: 'success' })
        } catch (err) {
            setRemoveTarget(null)
            toast({
                title: 'Failed to remove member',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    async function handleChangeSupervisor() {
        if (!supTarget) return
        setSavingSup(true)
        try {
            await apiFetch(`/employees/${supTarget.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ supervisorId: newSupervisorId }),
            })
            setSupTarget(null)
            setNewSupervisorId(null)
            await load()
            toast({ title: 'Supervisor updated', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to update supervisor',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setSavingSup(false)
        }
    }

    /* ── Render ── */

    if (loading) {
        return <div className="text-sm text-muted-foreground py-1">Loading members…</div>
    }

    return (
        <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Members</p>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setOpenAdd(true)}
                >
                    + Add Member
                </Button>
            </div>

            {/* Empty state */}
            {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members assigned to this unit.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Supervisor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-20 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                {/* Name + employee no */}
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                            <UserRound className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="leading-tight">
                                                {member.firstName} {member.lastName}
                                            </p>
                                            {member.employeeNo && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    {member.employeeNo}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Position */}
                                <TableCell className="text-sm text-muted-foreground">
                                    {member.positionTitle ?? '—'}
                                </TableCell>

                                {/* Supervisor — name shown inline; pencil opens change dialog */}
                                <TableCell>
                                    <button
                                        className="group flex items-center gap-1.5 text-left w-full rounded-md px-1 -mx-1 py-0.5 hover:bg-muted/60 transition-colors"
                                        onClick={() => {
                                            setSupTarget(member)
                                            setNewSupervisorId(member.supervisorId)
                                        }}
                                        title="Change supervisor"
                                    >
                                        <span className="text-sm text-muted-foreground leading-tight">
                                            {member.supervisorFirstName
                                                ? `${member.supervisorFirstName} ${member.supervisorLastName}`
                                                : <span className="italic text-muted-foreground/50">—</span>
                                            }
                                        </span>
                                        <Pencil className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </TableCell>

                                {/* Status badge */}
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${EMPLOYEE_STATUS_BADGE[member.status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}
                                    >
                                        {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                                    </span>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setRemoveTarget(member)}
                                        >
                                            Remove
                                        </Button>
                                    </div>

                                    {/* Remove confirmation */}
                                    <AlertDialog
                                        open={removeTarget?.id === member.id}
                                        onOpenChange={(open) => !open && setRemoveTarget(null)}
                                    >
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will unassign{' '}
                                                    <strong>
                                                        {member.firstName} {member.lastName}
                                                    </strong>{' '}
                                                    from this org unit. Their employment record will remain intact.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemove(member)}>
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

            {/* ── Add Member Dialog ── */}
            <Dialog
                open={openAdd}
                onOpenChange={(v) => {
                    setOpenAdd(v)
                    if (!v) setSelectedEmployeeId(null)
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Member to Unit</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <AsyncSearchSelect<SupervisorOption>
                            label="Employee"
                            value={selectedEmployeeId}
                            onChangeAction={setSelectedEmployeeId}
                            fetchOptions={async (search) => {
                                const res = await apiFetch<{ data: SupervisorOption[] }>(
                                    `/employees?search=${encodeURIComponent(search)}&pageSize=20`,
                                )
                                return res.data
                            }}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) =>
                                `${o.firstName} ${o.lastName}${o.employeeNo ? ` · ${o.employeeNo}` : ''}`
                            }
                            placeholder="Search employee…"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenAdd(false)
                                setSelectedEmployeeId(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={!selectedEmployeeId || saving}>
                            {saving ? 'Assigning…' : 'Add to Unit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Change Supervisor Dialog ── */}
            <Dialog
                open={!!supTarget}
                onOpenChange={(v) => {
                    if (!v) {
                        setSupTarget(null)
                        setNewSupervisorId(null)
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Change Supervisor — {supTarget?.firstName} {supTarget?.lastName}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <AsyncSearchSelect<SupervisorOption>
                            label="Supervisor"
                            value={newSupervisorId}
                            onChangeAction={setNewSupervisorId}
                            fetchOptions={async (search) => {
                                const res = await apiFetch<{ data: SupervisorOption[] }>(
                                    `/employees?status=ACTIVE&search=${encodeURIComponent(search)}&pageSize=20`,
                                )
                                return res.data
                            }}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) =>
                                `${o.firstName} ${o.lastName}${o.employeeNo ? ` · ${o.employeeNo}` : ''}`
                            }
                            placeholder="Search supervisor…"
                        />

                        {/* Allow clearing the supervisor */}
                        {newSupervisorId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => setNewSupervisorId(null)}
                            >
                                Clear supervisor
                            </Button>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSupTarget(null)
                                setNewSupervisorId(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleChangeSupervisor} disabled={savingSup}>
                            {savingSup ? 'Saving…' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

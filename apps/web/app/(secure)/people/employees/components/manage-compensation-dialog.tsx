'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { EmployeeCompensation, PayrollComponent } from '@/types/attendance.types'
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { RequiredInput } from '@/components/ui/required-input'
import { DatePickerField } from '@/components/ui/date-picker-field'

interface ManageCompensationDialogProps {
    employeeId: string
    employeeName: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

type EditableCompensation = Partial<EmployeeCompensation> & { payrollComponentId?: string };

export function ManageCompensationDialog({
    employeeId,
    employeeName,
    open,
    onOpenChange,
    onSuccess,
}: ManageCompensationDialogProps) {
    const { toast } = useToast()
    const [compensations, setCompensations] = useState<EmployeeCompensation[]>([])
    const [payrollComponents, setPayrollComponents] = useState<PayrollComponent[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingRecord, setEditingRecord] = useState<EditableCompensation | null>(null)

    const fetchCompData = useCallback(async () => {
        if (!employeeId) return
        setLoading(true)
        try {
            const [comps, payComps] = await Promise.all([
                apiFetch<EmployeeCompensation[]>(`/employee-compensations?employeeId=${employeeId}`),
                apiFetch<PayrollComponent[]>('/payroll-components?isRecurring=true')
            ])
            setCompensations(comps)
            setPayrollComponents(payComps)
        } catch (err) {
            console.error('Failed to fetch compensation data', err)
            toast({ title: 'Error', description: 'Could not load compensation data.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [employeeId, toast])

    useEffect(() => {
        if (open) {
            fetchCompData()
        }
    }, [open, fetchCompData])

    const handleAddNew = () => {
        setEditingRecord({
            id: 'new',
            payrollComponentId: '',
            amount: '0.00',
            effectiveFrom: new Date().toISOString().split('T')[0],
        })
    }

    const handleSave = async (record: EditableCompensation) => {
        if (!record.payrollComponentId || !record.amount || !record.effectiveFrom) {
            toast({ title: 'Validation Error', description: 'Component, Amount, and Effective Date are required.', variant: 'destructive' })
            return;
        }

        setSaving(true)
        try {
            const isNew = record.id === 'new';
            const method = isNew ? 'POST' : 'PATCH';
            const endpoint = isNew ? '/employee-compensations' : `/employee-compensations/${record.id}`;

            const payload = {
                ...record,
                employeeId,
                id: isNew ? undefined : record.id,
            };

            await apiFetch(endpoint, { method, body: JSON.stringify(payload) });

            toast({ title: 'Success', description: `Compensation record ${isNew ? 'added' : 'updated'}.` })
            setEditingRecord(null)
            fetchCompData()
            onSuccess?.()
        } catch (err) {
            console.error('Failed to save compensation', err)
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save record.', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this compensation item?')) return

        setSaving(true)
        try {
            await apiFetch(`/employee-compensations/${id}`, { method: 'DELETE' });
            toast({ title: 'Success', description: 'Compensation record deleted.' })
            fetchCompData()
            onSuccess?.()
        } catch (err) {
            console.error('Failed to delete compensation', err)
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete record.', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const renderRecord = (record: EmployeeCompensation) => (
        <TableRow key={record.id}>
            <TableCell>
                <p className="font-medium">{record.component.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{record.component.code}</p>
            </TableCell>
            <TableCell>
                <Badge variant={record.component.type === 'EARNING' ? 'default' : 'destructive'}>
                    {record.component.type}
                </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
                {Number(record.amount).toFixed(2)}
            </TableCell>
            <TableCell>
                {format(new Date(record.effectiveFrom), 'PP')}
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(record.id)}><Trash2 className="w-4 h-4" /></Button>
            </TableCell>
        </TableRow>
    )

    const renderEditRow = (record: EditableCompensation) => (
        <TableRow className="bg-muted/50">
            <TableCell>
                <RequiredSelect
                    value={record.payrollComponentId ?? ""}
                    onChangeAction={(v) => setEditingRecord({ ...record, payrollComponentId: v })}
                >
                    {payrollComponents.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </RequiredSelect>
            </TableCell>
            <TableCell colSpan={2}>
                <RequiredInput
                    value={record.amount || ''}
                    onChangeAction={(v) => setEditingRecord({ ...record, amount: v })}
                    placeholder="0.00"
                />
            </TableCell>
            <TableCell>
                <DatePickerField
                    value={record.effectiveFrom || ''}
                    onChangeAction={(v) => setEditingRecord({ ...record, effectiveFrom: v })}
                />
            </TableCell>
            <TableCell className="text-right">
                <Button size="sm" onClick={() => handleSave(record)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingRecord(null)}>Cancel</Button>
            </TableCell>
        </TableRow>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        Manage Compensation
                    </DialogTitle>
                    <DialogDescription>
                        Recurring earnings and deductions for <strong>{employeeName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Component</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount (PHP)</TableHead>
                                <TableHead>Effective From</TableHead>
                                <TableHead className="text-right w-25">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : (
                                <>
                                    {compensations.map(renderRecord)}
                                    {editingRecord && renderEditRow(editingRecord)}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="sm:justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={handleAddNew}
                        disabled={!!editingRecord}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Component
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

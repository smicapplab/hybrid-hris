'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequiredInput } from '@/components/ui/required-input'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Employee } from '@/types/employee.type'
import { EmployeeCompensation, PayrollComponent } from '@/types/attendance.types'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Plus, Edit, Trash2, Wallet } from 'lucide-react'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { SectionHeading } from '../../../helpers'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface CompensationTabProps {
    employee: Employee;
    compensations: EmployeeCompensation[];
    payrollComponents: PayrollComponent[];
    fetchAncillaryData: () => void;
}

type EditableCompensation = Partial<EmployeeCompensation> & { payrollComponentId?: string };

export function CompensationTab({
    employee,
    compensations,
    payrollComponents,
    fetchAncillaryData,
}: CompensationTabProps) {
    const { toast } = useToast()
    const [editingComp, setEditingComp] = useState<EditableCompensation | null>(null);
    const [saving, setSaving] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleCompSave = async (record: EditableCompensation) => {
        const isNew = record.id === 'new';
        
        if ((isNew && !record.payrollComponentId) || !record.amount || !record.effectiveFrom) {
            toast({ title: 'Validation Error', description: isNew ? 'Component, Amount, and Effective Date are required.' : 'Amount and Effective Date are required.', variant: 'destructive' })
            return;
        }

        setSaving(true)
        try {
            const method = isNew ? 'POST' : 'PATCH';
            const endpoint = isNew ? '/employee-compensations' : `/employee-compensations/${record.id}`;

            // Strip nested component object and keep only what's needed for the DTO
            const { component, ...restRecord } = record as any;
            const payload = { ...restRecord, employeeId: employee.id, id: isNew ? undefined : record.id };
            
            await apiFetch(endpoint, { method, body: JSON.stringify(payload) });

            toast({ title: 'Success', description: `Compensation record ${isNew ? 'added' : 'updated'}.` })
            setEditingComp(null)
            fetchAncillaryData()
        } catch (err) {
            console.error('Failed to save compensation', err)
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save record.', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const handleCompDelete = async (compId: string) => {
        setIdToDelete(compId)
        setIsDeleteConfirmOpen(true)
    }

    const confirmCompDelete = async () => {
        if (!idToDelete) return
        const compId = idToDelete
        setIsDeleting(true)
        try {
            await apiFetch(`/employee-compensations/${compId}`, { method: 'DELETE' });
            toast({ title: 'Success', description: 'Compensation record deleted.' });
            fetchAncillaryData();
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'Failed to delete record.', variant: 'destructive' });
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="shadow-sm border-muted/60">
            <CardContent className="pt-8 space-y-8">
                <div className="space-y-6">
                    <SectionHeading>Compensation Package</SectionHeading>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Component</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Effective Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {compensations.map(c => (
                                editingComp?.id === c.id ? (
                                    <TableRow key="edit-row" className="bg-slate-50">
                                        <TableCell className="font-medium text-slate-900">{c.component.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.component.type === 'EARNING' ? 'default' : 'destructive'} className="text-[10px] font-semibold uppercase tracking-tight">
                                                {c.component.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <RequiredInput value={editingComp.amount || ''} onChangeAction={v => setEditingComp({ ...editingComp, amount: v })} />
                                        </TableCell>
                                        <TableCell>
                                            <DatePickerField value={editingComp.effectiveFrom || ''} onChangeAction={v => setEditingComp({ ...editingComp, effectiveFrom: v })} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" onClick={() => handleCompSave(editingComp!)} className="font-bold">Save</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingComp(null)}>Cancel</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-700">{c.component.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.component.type === 'EARNING' ? 'default' : 'destructive'} className="text-[10px] font-medium uppercase tracking-tight">
                                                {c.component.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium text-slate-900">
                                            ₱{Number(c.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">{format(new Date(c.effectiveFrom), 'PP')}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingComp(c)} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                                    <Edit size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleCompDelete(c.id)} className="h-8 w-8 text-slate-400 hover:text-destructive">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            ))}
                            {editingComp && editingComp.id === 'new' && (
                                <TableRow>
                                    <TableCell>
                                        <RequiredSelect
                                            value={editingComp.payrollComponentId ?? ''}
                                            onChangeAction={v => setEditingComp({ ...editingComp, payrollComponentId: v })}
                                        >
                                            {payrollComponents.map(pc => (
                                                <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
                                            ))}
                                        </RequiredSelect>
                                    </TableCell>
                                    <TableCell colSpan={2}>
                                        <RequiredInput value={editingComp.amount || ''} onChangeAction={v => setEditingComp({ ...editingComp, amount: v })} />
                                    </TableCell>
                                    <TableCell>
                                        <DatePickerField value={editingComp.effectiveFrom || ''} onChangeAction={v => setEditingComp({ ...editingComp, effectiveFrom: v })} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => handleCompSave(editingComp!)}>Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingComp(null)}>Cancel</Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-start">
                    <Button variant="outline" size="sm" className="font-semibold border-slate-200" onClick={() => setEditingComp({ id: 'new', amount: '0.00', effectiveFrom: new Date().toISOString().split('T')[0] })}>
                        <Plus size={16} className="mr-2" />
                        Add Ad-hoc Component
                    </Button>
                </div>
            </CardContent>

            <ConfirmDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                onConfirm={confirmCompDelete}
                title="Delete Compensation"
                description="Are you sure you want to delete this compensation record? This action cannot be undone."
                variant="destructive"
                loading={isDeleting}
            />
        </Card>
    );
}

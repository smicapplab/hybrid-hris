'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { RequiredInput } from '@/components/ui/required-input'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit2, Trash2, ReceiptText, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PayrollComponent } from '@/types/attendance.types'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const INITIAL_FORM_DATA = {
    code: '',
    name: '',
    description: '',
    type: 'EARNING' as 'EARNING' | 'DEDUCTION' | 'EMPLOYER_COST',
    isTaxable: true,
    isDeMinimis: false,
    isStatutory: false,
    isRecurring: true,
    taxExemptLimit: '0.00',
}

export default function PayrollComponentsPage() {
    const { toast } = useToast()
    const [components, setComponents] = useState<PayrollComponent[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState(INITIAL_FORM_DATA)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchComponents = useCallback(async () => {
        try {
            const data = await apiFetch<PayrollComponent[]>('/payroll-components')
            setComponents(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load payroll components", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchComponents()
    }, [fetchComponents])

    const openCreateDialog = () => {
        setEditingId(null)
        setFormData(INITIAL_FORM_DATA)
        setDialogOpen(true)
    }

    const openEditDialog = (c: PayrollComponent) => {
        setEditingId(c.id)
        setFormData({
            code: c.code,
            name: c.name,
            description: c.description || '',
            type: c.type,
            isTaxable: c.isTaxable,
            isDeMinimis: c.isDeMinimis,
            isStatutory: c.isStatutory,
            isRecurring: c.isRecurring,
            taxExemptLimit: c.taxExemptLimit,
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.code || !formData.name) {
            toast({ title: "Validation Error", description: "Code and Name are required", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            const method = editingId ? 'PATCH' : 'POST'
            const endpoint = editingId ? `/payroll-components/${editingId}` : '/payroll-components'
            
            await apiFetch(endpoint, {
                method,
                body: JSON.stringify(formData)
            })

            toast({ 
                title: editingId ? "Component Updated" : "Component Created", 
                variant: "success" 
            })
            setDialogOpen(false)
            fetchComponents()
        } catch (err) {
            console.error(err)
            toast({ 
                title: "Error", 
                description: err instanceof Error ? err.message : "Failed to save payroll component", 
                variant: "destructive" 
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        setIdToDelete(id)
        setIsDeleteConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (!idToDelete) return
        const id = idToDelete
        setIsDeleting(true)
        try {
            await apiFetch(`/payroll-components/${id}`, { method: 'DELETE' })
            toast({ title: "Component Deleted", variant: "success" })
            fetchComponents()
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to delete component", variant: "destructive" })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payroll Components</h1>
                    <p className="text-muted-foreground">Manage the earnings and deductions dictionary for payroll.</p>
                </div>
                <Button onClick={openCreateDialog} className="font-bold gap-2">
                    <Plus className="w-4 h-4" />
                    New Component
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-32 font-bold">CODE</TableHead>
                                <TableHead className="font-bold">NAME</TableHead>
                                <TableHead className="font-bold">TYPE</TableHead>
                                <TableHead className="font-bold">TAXABILITY</TableHead>
                                <TableHead className="font-bold">FEATURES</TableHead>
                                <TableHead className="text-right font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading components...</TableCell></TableRow>
                            ) : components.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No payroll components defined yet.</TableCell></TableRow>
                            ) : components.map(c => (
                                <TableRow key={c.id} className="group">
                                    <TableCell className="font-mono text-xs font-bold">{c.code}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{c.name}</span>
                                            {c.description && <span className="text-[10px] text-muted-foreground truncate max-w-50">{c.description}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={c.type === 'EARNING' ? "default" : c.type === 'EMPLOYER_COST' ? 'outline' : "destructive"} className="font-bold text-[10px]">
                                            {c.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={c.isTaxable ? "secondary" : "outline"} className="w-fit font-bold text-[9px]">
                                                {c.isTaxable ? 'TAXABLE' : 'NON-TAXABLE'}
                                            </Badge>
                                            {c.isDeMinimis && (
                                                <Badge variant="outline" className="w-fit font-bold text-[9px] border-blue-200 text-blue-600 bg-blue-50">
                                                    DE MINIMIS (limit: ₱{c.taxExemptLimit})
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {c.isStatutory && <Badge variant="outline" className="font-bold text-[9px] border-amber-200 text-amber-600 bg-amber-50">STATUTORY</Badge>}
                                            {c.isRecurring && <Badge variant="outline" className="font-bold text-[9px]">RECURRING</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-primary" />
                            {editingId ? 'Edit Payroll Component' : 'Create Payroll Component'}
                        </DialogTitle>
                        <DialogDescription>
                            Define how this component should be treated by the payroll engine.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <RequiredInput 
                                label="Component Code" 
                                value={formData.code} 
                                onChangeAction={v => setFormData({...formData, code: v.toUpperCase()})}
                                disabled={!!editingId}
                                placeholder="e.g. BASIC_PAY, RICE_SUB"
                            />
                            <RequiredInput 
                                label="Display Name" 
                                value={formData.name} 
                                onChangeAction={v => setFormData({...formData, name: v})}
                                placeholder="e.g. Basic Salary"
                            />
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">Description</Label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <RequiredSelect
                                label="Component Type"
                                value={formData.type}
                                onChangeAction={v => setFormData({...formData, type: v as 'EARNING' | 'DEDUCTION' | 'EMPLOYER_COST'})}
                            >
                                <SelectItem value="EARNING">Earning</SelectItem>
                                <SelectItem value="DEDUCTION">Deduction</SelectItem>
                                <SelectItem value="EMPLOYER_COST">Employer Cost</SelectItem>
                            </RequiredSelect>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="isTaxable" checked={formData.isTaxable} onCheckedChange={v => setFormData({...formData, isTaxable: !!v})} />
                                        <Label htmlFor="isTaxable" className="text-sm font-medium">Taxable</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="isRecurring" checked={formData.isRecurring} onCheckedChange={v => setFormData({...formData, isRecurring: !!v})} />
                                        <Label htmlFor="isRecurring" className="text-sm font-medium">Recurring</Label>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="isDeMinimis" checked={formData.isDeMinimis} onCheckedChange={v => setFormData({...formData, isDeMinimis: !!v})} />
                                        <Label htmlFor="isDeMinimis" className="text-sm font-medium">De Minimis</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="isStatutory" checked={formData.isStatutory} onCheckedChange={v => setFormData({...formData, isStatutory: !!v})} />
                                        <Label htmlFor="isStatutory" className="text-sm font-medium">Statutory</Label>
                                    </div>
                                </div>
                            </div>

                            {formData.isDeMinimis && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <Info className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">De Minimis Settings</span>
                                    </div>
                                    <RequiredInput 
                                        label="Tax Exempt Limit (Monthly)" 
                                        value={formData.taxExemptLimit} 
                                        onChangeAction={v => setFormData({...formData, taxExemptLimit: v})}
                                        placeholder="0.00"
                                    />
                                    <p className="text-[10px] text-blue-600 italic">Amounts exceeding this limit will automatically be treated as taxable income.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="font-bold min-w-30">
                            {saving ? 'Saving...' : 'Save Component'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                onConfirm={confirmDelete}
                title="Delete Payroll Component"
                description="Are you sure you want to delete this payroll component? This action cannot be undone and may affect existing payroll calculations."
                variant="destructive"
                loading={isDeleting}
            />
        </div>
    )
}

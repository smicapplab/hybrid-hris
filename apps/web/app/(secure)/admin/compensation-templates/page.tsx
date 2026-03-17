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
import { SelectItem, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CompensationTemplate {
    id: string;
    code: string;
    name: string;
    description: string | null;
    jobLevelId: string | null;
    components: any[];
}

interface JobLevel {
    id: string;
    code: string;
    name: string;
}

interface PayrollComponent {
    id: string;
    code: string;
    name: string;
}

const INITIAL_FORM_DATA = {
    code: '',
    name: '',
    description: '',
    jobLevelId: 'none',
    components: [],
}

export default function CompensationTemplatesPage() {
    const { toast } = useToast()
    const [templates, setTemplates] = useState<CompensationTemplate[]>([])
    const [jobLevels, setJobLevels] = useState<JobLevel[]>([])
    const [payrollComponents, setPayrollComponents] = useState<PayrollComponent[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<CompensationTemplate | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<any>(INITIAL_FORM_DATA)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [tmpls, lvls, comps] = await Promise.all([
                apiFetch<CompensationTemplate[]>('/compensation-templates'),
                apiFetch<JobLevel[]>('/job-levels'),
                apiFetch<PayrollComponent[]>('/payroll-components'),
            ])
            setTemplates(tmpls)
            setJobLevels(lvls)
            setPayrollComponents(comps)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const openCreateDialog = () => {
        setEditingTemplate(null)
        setFormData(INITIAL_FORM_DATA)
        setDialogOpen(true)
    }

    const openEditDialog = (t: CompensationTemplate) => {
        setEditingTemplate(t)
        setFormData({
            code: t.code,
            name: t.name,
            description: t.description || '',
            jobLevelId: t.jobLevelId || 'none',
            components: t.components || [],
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.code || !formData.name) return;

        setSaving(true)
        try {
            const method = editingTemplate ? 'PATCH' : 'POST'
            const endpoint = editingTemplate ? `/compensation-templates/${editingTemplate.id}` : '/compensation-templates'

            await apiFetch(endpoint, {
                method,
                body: JSON.stringify({
                    ...formData,
                    jobLevelId: formData.jobLevelId === 'none' ? null : formData.jobLevelId
                })
            })

            toast({ title: editingTemplate ? "Template Updated" : "Template Created", variant: "success" })
            setDialogOpen(false)
            fetchData()
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save template", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return
        try {
            await apiFetch(`/compensation-templates/${id}`, { method: 'DELETE' })
            toast({ title: "Template Deleted", variant: "success" })
            fetchData()
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to delete template", variant: "destructive" })
        }
    }

    const addComponent = () => {
        setFormData((prev: any) => ({
            ...prev,
            components: [...prev.components, { payrollComponentId: '', amount: '0.00' }]
        }))
    }

    const removeComponent = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            components: prev.components.filter((_: any, i: number) => i !== index)
        }))
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Compensation Templates</h1>
                    <p className="text-muted-foreground">Manage benefit and deduction packages linked to job levels.</p>
                </div>
                <Button onClick={openCreateDialog} className="font-bold gap-2">
                    <Plus className="w-4 h-4" />
                    New Template
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">TEMPLATE</TableHead>
                                <TableHead className="font-bold">LINKED JOB LEVEL</TableHead>
                                <TableHead className="font-bold text-center">COMPONENTS</TableHead>
                                <TableHead className="text-right font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : templates.map(t => (
                                <TableRow key={t.id} className="group">
                                    <TableCell>
                                        <p className="font-medium">{t.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{t.code}</p>
                                    </TableCell>
                                    <TableCell>
                                        {t.jobLevelId ? (
                                            <Badge variant="outline">{jobLevels.find(l => l.id === t.jobLevelId)?.name}</Badge>
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell className="text-center font-bold">{t.components?.length || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(t)}><Edit2 className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4" /></Button>
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
                        <DialogTitle>
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <RequiredInput label="Code" value={formData.code} onChangeAction={v => setFormData({ ...formData, code: v.toUpperCase() })} disabled={!!editingTemplate} />
                        <RequiredInput label="Name" value={formData.name} onChangeAction={v => setFormData({ ...formData, name: v })} />
                        <RequiredSelect label="Link to Job Level (Optional)" value={formData.jobLevelId} onChangeAction={v => setFormData({ ...formData, jobLevelId: v })}>
                            <SelectItem value="none">None</SelectItem>
                            {jobLevels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </RequiredSelect>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Compensation Components</h3>
                            <Button variant="outline" size="sm" onClick={addComponent} className="h-8 shadow-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Component
                            </Button>
                        </div>

                        <div className="border rounded-md overflow-hidden bg-card">
                            <div className="max-h-[400px] overflow-y-auto pr-0.5">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm transition-shadow">
                                        <TableRow>
                                            <TableHead className="w-[60%] font-bold text-xs uppercase tracking-wider">Component</TableHead>
                                            <TableHead className="w-[30%] font-bold text-xs uppercase tracking-wider">Amount</TableHead>
                                            <TableHead className="w-[10%] text-center font-bold text-xs uppercase tracking-wider"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.components.map((c: any, i: number) => (
                                            <TableRow key={i} className="group/row hover:bg-muted/30 transition-colors border-b last:border-0">
                                                <TableCell className="py-2">
                                                    <RequiredSelect
                                                        value={c.payrollComponentId}
                                                        onChangeAction={v => {
                                                            const isDuplicate = formData.components.some((item: any, idx: number) => item.payrollComponentId === v && idx !== i);
                                                            if (isDuplicate) {
                                                                toast({
                                                                    title: "Duplicate Component",
                                                                    description: "This component is already added to the template.",
                                                                    variant: "destructive"
                                                                });
                                                                return;
                                                            }
                                                            const newComps = [...formData.components];
                                                            newComps[i].payrollComponentId = v;
                                                            setFormData({ ...formData, components: newComps });
                                                        }}
                                                        className="space-y-0"
                                                        placeholder="Select component"
                                                    >
                                                        {payrollComponents.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
                                                    </RequiredSelect>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <RequiredInput
                                                        value={c.amount}
                                                        onChangeAction={v => {
                                                            const newComps = [...formData.components];
                                                            newComps[i].amount = v;
                                                            setFormData({ ...formData, components: newComps });
                                                        }}
                                                        className="space-y-0"
                                                        placeholder="0.00"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-all hover:scale-110 active:scale-95"
                                                        onClick={() => removeComponent(i)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {formData.components.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                        <Wallet className="w-10 h-10 text-muted-foreground" />
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium">No compensation items</p>
                                                            <p className="text-xs">Click "Add Component" above.</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

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
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit2, Trash2, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface JobLevel {
    id: string;
    code: string;
    name: string;
    description: string | null;
    rankOrder: number;
}

const INITIAL_FORM_DATA = {
    code: '',
    name: '',
    description: '',
    rankOrder: 1,
}

export default function JobLevelsPage() {
    const { toast } = useToast()
    const [levels, setLevels] = useState<JobLevel[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState(INITIAL_FORM_DATA)

    const fetchLevels = useCallback(async () => {
        try {
            const data = await apiFetch<JobLevel[]>('/job-levels')
            setLevels(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load job levels", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchLevels()
    }, [fetchLevels])

    const openCreateDialog = () => {
        setEditingId(null)
        setFormData(INITIAL_FORM_DATA)
        setDialogOpen(true)
    }

    const openEditDialog = (l: JobLevel) => {
        setEditingId(l.id)
        setFormData({
            code: l.code,
            name: l.name,
            description: l.description || '',
            rankOrder: l.rankOrder,
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
            const endpoint = editingId ? `/job-levels/${editingId}` : '/job-levels'
            
            await apiFetch(endpoint, {
                method,
                body: JSON.stringify(formData)
            })

            toast({ 
                title: editingId ? "Level Updated" : "Level Created", 
                variant: "success" 
            })
            setDialogOpen(false)
            fetchLevels()
        } catch (err) {
            console.error(err)
            toast({ 
                title: "Error", 
                description: err instanceof Error ? err.message : "Failed to save job level", 
                variant: "destructive" 
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this job level? This may affect employee records.')) return

        try {
            await apiFetch(`/job-levels/${id}`, { method: 'DELETE' })
            toast({ title: "Job Level Deleted", variant: "success" })
            fetchLevels()
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to delete job level", variant: "destructive" })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Job Levels & Ranks</h1>
                    <p className="text-muted-foreground">Define the hierarchical tiers used for benefits and compensation.</p>
                </div>
                <Button onClick={openCreateDialog} className="font-bold gap-2">
                    <Plus className="w-4 h-4" />
                    New Level
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-24 font-bold text-center">RANK</TableHead>
                                <TableHead className="w-32 font-bold">CODE</TableHead>
                                <TableHead className="font-bold">NAME</TableHead>
                                <TableHead className="font-bold">DESCRIPTION</TableHead>
                                <TableHead className="text-right font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading job levels...</TableCell></TableRow>
                            ) : levels.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No job levels defined yet.</TableCell></TableRow>
                            ) : levels.map(l => (
                                <TableRow key={l.id} className="group">
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                                            {l.rankOrder}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs font-bold">{l.code}</TableCell>
                                    <TableCell className="font-medium">{l.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                        {l.description || '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(l)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(l.id)}>
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {editingId ? 'Edit Job Level' : 'Create Job Level'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure organizational hierarchy tiers.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <RequiredInput 
                                label="Code" 
                                value={formData.code} 
                                onChangeAction={v => setFormData({...formData, code: v.toUpperCase()})}
                                disabled={!!editingId}
                                placeholder="e.g. L1"
                            />
                            <RequiredInput 
                                type="number"
                                label="Rank Order" 
                                value={formData.rankOrder.toString()} 
                                onChangeAction={v => setFormData({...formData, rankOrder: parseInt(v) || 1})}
                            />
                        </div>
                        <RequiredInput 
                            label="Name" 
                            value={formData.name} 
                            onChangeAction={v => setFormData({...formData, name: v})}
                            placeholder="e.g. Junior Staff"
                        />
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider">Description</Label>
                            <textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Optional details about this level..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="font-bold min-w-30">
                            {saving ? 'Saving...' : 'Save Level'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

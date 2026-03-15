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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { ShiftTemplate } from '@/types/attendance.types'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const INITIAL_FORM_DATA = {
    code: '',
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    isFlexible: false,
    isActive: true,
    isMon: true, isTue: true, isWed: true, isThu: true, isFri: true, isSat: false, isSun: false
}

const getDaysDisplay = (t: ShiftTemplate) => {
    const days = []
    if (t.isMon) days.push('M')
    if (t.isTue) days.push('T')
    if (t.isWed) days.push('W')
    if (t.isThu) days.push('Th')
    if (t.isFri) days.push('F')
    if (t.isSat) days.push('S')
    if (t.isSun) days.push('Su')
    return days.length === 7 ? 'Daily' : days.join('-') || 'None'
}

export default function ShiftTemplatesPage() {
    const { toast } = useToast()
    const [templates, setTemplates] = useState<ShiftTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState(INITIAL_FORM_DATA)

    const fetchTemplates = useCallback(async () => {
        try {
            const data = await apiFetch<ShiftTemplate[]>('/shift-templates')
            setTemplates(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load shift templates", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    const openCreateDialog = () => {
        setEditingId(null)
        setFormData(INITIAL_FORM_DATA)
        setDialogOpen(true)
    }

    const openEditDialog = (t: ShiftTemplate) => {
        setEditingId(t.id)
        setFormData({
            code: t.code,
            name: t.name,
            startTime: t.startTime,
            endTime: t.endTime,
            breakMinutes: t.breakMinutes,
            isFlexible: t.isFlexible,
            isActive: t.isActive,
            isMon: t.isMon, isTue: t.isTue, isWed: t.isWed, isThu: t.isThu, isFri: t.isFri, isSat: t.isSat, isSun: t.isSun
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
            const endpoint = editingId ? `/shift-templates/${editingId}` : '/shift-templates'
            
            await apiFetch(endpoint, {
                method,
                body: JSON.stringify(formData)
            })

            toast({ 
                title: editingId ? "Template Updated" : "Template Created", 
                variant: "success" 
            })
            setDialogOpen(false)
            fetchTemplates()
        } catch (err) {
            console.error(err)
            toast({ 
                title: "Error", 
                description: err instanceof Error ? err.message : "Failed to save template", 
                variant: "destructive" 
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return

        try {
            await apiFetch(`/shift-templates/${id}`, { method: 'DELETE' })
            toast({ title: "Template Deleted", variant: "success" })
            fetchTemplates()
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to delete template", variant: "destructive" })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Shift Templates</h1>
                    <p className="text-muted-foreground">Define standard working hours and schedules.</p>
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
                                <TableHead className="w-32 font-bold">CODE</TableHead>
                                <TableHead className="font-bold">NAME</TableHead>
                                <TableHead className="font-bold">HOURS</TableHead>
                                <TableHead className="font-bold">DAYS</TableHead>
                                <TableHead className="font-bold text-center">STATUS</TableHead>
                                <TableHead className="text-right font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading templates...</TableCell></TableRow>
                            ) : templates.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No shift templates defined yet.</TableCell></TableRow>
                            ) : templates.map(t => (
                                <TableRow key={t.id} className="group">
                                    <TableCell className="font-mono text-xs font-bold">{t.code}</TableCell>
                                    <TableCell className="font-medium">{t.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{t.startTime} - {t.endTime}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{t.breakMinutes}m break · {t.isFlexible ? 'Flexible' : 'Fixed'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-bold text-[10px]">
                                            {getDaysDisplay(t)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {t.isActive ? (
                                            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 font-bold text-[10px]">ACTIVE</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground font-bold text-[10px]">INACTIVE</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(t)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
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
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Shift Template' : 'Create Shift Template'}</DialogTitle>
                        <DialogDescription>
                            Configure the working hours and default days for this template.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-4 col-span-2">
                            <div className="grid grid-cols-2 gap-4">
                                <RequiredInput 
                                    label="Code" 
                                    value={formData.code} 
                                    onChangeAction={v => setFormData({...formData, code: v.toUpperCase()})}
                                    disabled={!!editingId}
                                    placeholder="e.g. REG-8-5"
                                />
                                <RequiredInput 
                                    label="Name" 
                                    value={formData.name} 
                                    onChangeAction={v => setFormData({...formData, name: v})}
                                    placeholder="e.g. Regular Shift (8am-5pm)"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider">Start Time</Label>
                            <input 
                                type="time" 
                                value={formData.startTime} 
                                onChange={e => setFormData({...formData, startTime: e.target.value})}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider">End Time</Label>
                            <input 
                                type="time" 
                                value={formData.endTime} 
                                onChange={e => setFormData({...formData, endTime: e.target.value})}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <RequiredInput 
                                type="number"
                                label="Break (Minutes)" 
                                value={formData.breakMinutes.toString()} 
                                onChangeAction={v => setFormData({...formData, breakMinutes: parseInt(v) || 0})}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-6">
                            <Checkbox 
                                id="isFlexible" 
                                checked={formData.isFlexible} 
                                onCheckedChange={v => setFormData({...formData, isFlexible: !!v})} 
                            />
                            <Label htmlFor="isFlexible" className="text-sm font-medium">Flexible Hours</Label>
                        </div>

                        <div className="col-span-2 space-y-3 pt-2">
                            <Label className="text-xs font-bold uppercase tracking-wider">Active Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {(['isMon', 'isTue', 'isWed', 'isThu', 'isFri', 'isSat', 'isSun'] as const).map(day => (
                                    <div 
                                        key={day}
                                        onClick={() => setFormData(prev => ({ ...prev, [day]: !prev[day] }))}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter cursor-pointer transition-all border
                                            ${formData[day] 
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}
                                        `}
                                    >
                                        {day.slice(2)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <Checkbox 
                                id="isActive" 
                                checked={formData.isActive} 
                                onCheckedChange={v => setFormData({...formData, isActive: !!v})} 
                            />
                            <Label htmlFor="isActive" className="text-sm font-medium">Active Template</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="font-bold min-w-30">
                            {saving ? 'Saving...' : 'Save Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

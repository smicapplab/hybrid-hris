'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { ShiftTemplate, ShiftAssignment } from '@/types/attendance.types'
import { format } from 'date-fns'
import { Clock, Calendar, AlertCircle } from 'lucide-react'

interface ChangeScheduleDialogProps {
    employeeId: string
    employeeName: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function ChangeScheduleDialog({
    employeeId,
    employeeName,
    open,
    onOpenChange,
    onSuccess,
}: ChangeScheduleDialogProps) {
    const { toast } = useToast()
    const [templates, setTemplates] = useState<ShiftTemplate[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [effectiveDate, setEffectiveDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [loading, setLoading] = useState(false)
    const [fetchingTemplates, setFetchingTemplates] = useState(false)

    // Form Overrides
    const [isCustom, setIsCustom] = useState(false)
    const [startTime, setStartTime] = useState('08:00')
    const [endTime, setEndTime] = useState('17:00')
    const [breakMinutes, setBreakMinutes] = useState(60)
    const [days, setDays] = useState({
        isMon: true, isTue: true, isWed: true, isThu: true, isFri: true, isSat: false, isSun: false
    })

    useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    async function fetchTemplates() {
        setFetchingTemplates(true)
        try {
            const data = await apiFetch<ShiftTemplate[]>('/shift-templates')
            setTemplates(data)
            if (data.length > 0 && !selectedTemplateId) {
                applyTemplate(data[0]!)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setFetchingTemplates(false)
        }
    }

    const applyTemplate = (t: ShiftTemplate) => {
        setSelectedTemplateId(t.id)
        setStartTime(t.startTime)
        setEndTime(t.endTime)
        setBreakMinutes(t.breakMinutes)
        setDays({
            isMon: t.isMon,
            isTue: t.isTue,
            isWed: t.isWed,
            isThu: t.isThu,
            isFri: t.isFri,
            isSat: t.isSat,
            isSun: t.isSun,
        })
    }

    const handleTemplateChange = (id: string) => {
        const t = templates.find(x => x.id === id)
        if (t) applyTemplate(t)
    }

    async function handleSubmit() {
        if (!selectedTemplateId || !effectiveDate) return

        setLoading(true)
        try {
            const isToday = effectiveDate === format(new Date(), 'yyyy-MM-dd')
            const endpoint = isToday ? '/shift-assignments' : '/pending-shift-assignments'
            
            const payload = {
                employeeId,
                shiftTemplateId: selectedTemplateId,
                effectiveFrom: effectiveDate,
                override: isCustom ? {
                    startTime,
                    endTime,
                    breakMinutes,
                    ...days
                } : undefined
            }

            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            })

            toast({
                title: isToday ? "Schedule Updated" : "Schedule Change Queued",
                description: isToday 
                    ? `Active schedule for ${employeeName} has been updated.` 
                    : `Schedule change for ${employeeName} set for ${format(new Date(effectiveDate), 'PP')}.`,
                variant: "success"
            })

            onOpenChange(false)
            onSuccess?.()
        } catch (err) {
            console.error(err)
            toast({
                title: "Failed to Change Schedule",
                description: err instanceof Error ? err.message : "An unexpected error occurred",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Change Schedule
                    </DialogTitle>
                    <DialogDescription>
                        Set a new shift schedule for <strong>{employeeName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 gap-4">
                        <RequiredSelect
                            label="Shift Template"
                            value={selectedTemplateId}
                            onChangeAction={handleTemplateChange}
                            disabled={fetchingTemplates}
                        >
                            {templates.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name} ({t.startTime}-{t.endTime})
                                </SelectItem>
                            ))}
                        </RequiredSelect>

                        <DatePickerField
                            label="Effective Date"
                            value={effectiveDate}
                            onChangeAction={setEffectiveDate}
                            required
                        />
                        {effectiveDate > format(new Date(), 'yyyy-MM-dd') && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-[11px] font-medium uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" />
                                This will be queued as a pending change
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Schedule Preview</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="custom-toggle" 
                                    checked={isCustom} 
                                    onCheckedChange={(checked) => setIsCustom(!!checked)} 
                                />
                                <Label htmlFor="custom-toggle" className="text-xs font-medium cursor-pointer">Override Template</Label>
                            </div>
                        </div>

                        <div className={`grid grid-cols-2 gap-4 ${!isCustom ? 'opacity-60 pointer-events-none' : ''}`}>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Start Time</Label>
                                <input 
                                    type="time" 
                                    value={startTime} 
                                    onChange={e => setStartTime(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest">End Time</Label>
                                <input 
                                    type="time" 
                                    value={endTime} 
                                    onChange={e => setEndTime(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className={`space-y-3 ${!isCustom ? 'opacity-60 pointer-events-none' : ''}`}>
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Working Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {(['isMon', 'isTue', 'isWed', 'isThu', 'isFri', 'isSat', 'isSun'] as const).map(day => (
                                    <div 
                                        key={day}
                                        onClick={() => isCustom && setDays(prev => ({ ...prev, [day]: !prev[day] }))}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter cursor-pointer transition-all border
                                            ${days[day] 
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}
                                        `}
                                    >
                                        {day.slice(2)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedTemplateId} className="font-bold min-w-[120px]">
                        {loading ? 'Processing...' : 'Save Schedule'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

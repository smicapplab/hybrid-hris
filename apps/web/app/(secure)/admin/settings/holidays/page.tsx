'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
    Calendar, 
    Plus, 
    MoreHorizontal, 
    Pencil, 
    Trash2, 
    AlertTriangle, 
    CheckCircle2,
    Loader2,
    Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, isWeekend } from 'date-fns'
import { Holiday } from '@/types/attendance.types'
import { HolidayDialog } from './holiday-dialog'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Badge } from '@/components/ui/badge'

export default function HolidaySettingsPage() {
    const { toast } = useToast()
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    
    // Dialog States
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
    const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const loadHolidays = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiFetch<Holiday[]>(`/hr-settings/holidays?year=${selectedYear}`)
            setHolidays(data ?? [])
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to load holidays', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [selectedYear, toast])

    useEffect(() => {
        loadHolidays()
    }, [loadHolidays])

    const handleAdd = () => {
        setEditingHoliday(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (h: Holiday) => {
        setEditingHoliday(h)
        setIsDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!holidayToDelete) return
        try {
            await apiFetch(`/hr-settings/holidays/${holidayToDelete.id}`, { method: 'DELETE' })
            toast({ title: 'Holiday deleted', variant: 'success' })
            loadHolidays()
        } catch (err) {
            toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
        } finally {
            setHolidayToDelete(null)
        }
    }

    const handleProcessPay = async (h: Holiday) => {
        try {
            setProcessingId(h.id)
            const result = await apiFetch<{ success: boolean, count: number }>(`/hr-settings/holidays/${h.id}/process`, { method: 'POST' })
            
            if (result.success) {
                toast({ 
                    title: 'Processing Complete', 
                    description: `Generated holiday pay logs for ${result.count} employees.`,
                    variant: 'success' 
                })
            } else {
                toast({ title: 'Skipped', description: 'Today is not the holiday date or logs already exist.', variant: 'default' })
            }
        } catch (err) {
            toast({ title: 'Processing Failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' })
        } finally {
            setProcessingId(null)
        }
    }

    const years = [selectedYear - 1, selectedYear, selectedYear + 1]

    return (
        <div className="p-6 space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-900">Holiday Maintenance</h1>
                    <p className="text-muted-foreground text-sm">Manage the yearly holiday registry and process unworked holiday pay.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-muted p-1 rounded-lg border border-blue-100/50">
                        {years.map(y => (
                            <button
                                key={y}
                                onClick={() => setSelectedYear(y)}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                    selectedYear === y ? "bg-white text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                    <Button onClick={handleAdd} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> Add Holiday
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-3 bg-blue-50/20 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        PH Holiday Registry for {selectedYear}
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-200" />
                        </div>
                    ) : holidays.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Calendar className="w-10 h-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground font-medium">
                                No holidays registered for {selectedYear}.
                            </p>
                            <Button variant="outline" size="sm" onClick={handleAdd}>
                                Start Adding for {selectedYear}
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>Holiday Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Day of Week</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Automation</TableHead>
                                    <TableHead className="w-12.5"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {holidays.map(h => {
                                    const dateObj = parseISO(h.date)
                                    const isDayWeekend = isWeekend(dateObj)
                                    const dayName = format(dateObj, 'EEEE')

                                    return (
                                        <TableRow key={h.id} className="hover:bg-blue-50/30 transition-colors">
                                            <TableCell className="font-semibold text-blue-900">
                                                {h.name}
                                            </TableCell>
                                            <TableCell className="tabular-nums font-medium">
                                                {format(dateObj, 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                                                        isDayWeekend ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-zinc-50 text-zinc-600 border-zinc-200"
                                                    )}>
                                                        {dayName}
                                                    </span>
                                                    {isDayWeekend && (
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-bold uppercase",
                                                    h.type === 'REGULAR' ? "border-blue-200 text-blue-700 bg-blue-50" : "border-indigo-200 text-indigo-700 bg-indigo-50"
                                                )}>
                                                    {h.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 text-[11px] font-bold"
                                                    onClick={() => handleProcessPay(h)}
                                                    disabled={!!processingId}
                                                >
                                                    {processingId === h.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Zap className="w-3.5 h-3.5 fill-current" />
                                                    )}
                                                    Process Holiday Pay
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(h)} className="gap-2 cursor-pointer">
                                                            <Pencil className="w-3.5 h-3.5" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => setHolidayToDelete(h)} 
                                                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete Holiday
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="flex gap-2 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold">HR Tip: Weekend Holidays</p>
                    <p className="text-xs leading-relaxed opacity-90">
                        If a holiday falls on a Saturday or Sunday, update the <strong>Date</strong> column to the officially proclaimed non-working day (usually the following Monday) to ensure all employees receive their unworked holiday pay correctly.
                    </p>
                </div>
            </div>

            <HolidayDialog
                open={isDialogOpen}
                onOpenChangeAction={setIsDialogOpen}
                initialData={editingHoliday}
                onSuccessAction={loadHolidays}
            />

            <ConfirmDialog
                open={!!holidayToDelete}
                onOpenChange={(o) => !o && setHolidayToDelete(null)}
                title="Delete Holiday"
                description={`Are you sure you want to delete "${holidayToDelete?.name}"? This will not affect attendance logs already generated.`}
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    )
}

'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Calculator } from 'lucide-react'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AccrualDialog({ open, onOpenChange }: Props) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const now = new Date()
    const [year, setYear] = useState(now.getFullYear().toString())
    const [month, setMonth] = useState((now.getMonth() + 1).toString())

    const years = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - i).toString())
    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ]

    const handleProcess = async () => {
        setLoading(true)
        try {
            const result = await apiFetch<{ processedCount: number, accrualKey: string }>('/leave-accruals/process-monthly', {
                method: 'POST',
                body: JSON.stringify({
                    year: parseInt(year),
                    month: parseInt(month)
                })
            })

            toast({
                title: 'Accrual Processed',
                description: `Successfully processed ${result.processedCount} leave accruals for ${months.find(m => m.value === month)?.label} ${year}.`,
                variant: 'success'
            })
            onOpenChange(false)
        } catch (err) {
            toast({
                title: 'Accrual Failed',
                description: err instanceof Error ? err.message : 'Failed to process accruals.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-violet-500" />
                        Process Monthly Accruals
                    </DialogTitle>
                    <DialogDescription>
                        This will calculate and add leave credits for all active employees based on their assigned policy rules.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right">Year</Label>
                        <div className="col-span-3">
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger id="year">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="month" className="text-right">Month</Label>
                        <div className="col-span-3">
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger id="month">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleProcess} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Run Accrual
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Holiday } from '@/types/attendance.types'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    initialData?: Holiday | null
    onSuccessAction: () => void
}

export function HolidayDialog({ open, onOpenChangeAction, initialData, onSuccessAction }: Props) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [date, setDate] = useState('')
    const [type, setType] = useState<'REGULAR' | 'SPECIAL'>('REGULAR')

    useEffect(() => {
        if (initialData) {
            setName(initialData.name)
            setDate(initialData.date)
            setType(initialData.type)
        } else {
            setName('')
            setDate('')
            setType('REGULAR')
        }
    }, [initialData, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const isEdit = !!initialData
            const url = isEdit ? `/hr-settings/holidays/${initialData.id}` : '/hr-settings/holidays'
            const method = isEdit ? 'PATCH' : 'POST'

            await apiFetch(url, {
                method,
                body: JSON.stringify({ name, date, type, countryCode: 'PH' })
            })

            toast({ 
                title: isEdit ? 'Holiday Updated' : 'Holiday Created', 
                variant: 'success' 
            })
            onSuccessAction()
            onOpenChangeAction(false)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Operation failed';
            toast({ title: 'Error', description: message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{initialData ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Holiday Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Christmas Day"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={type} onValueChange={(v) => setType(v as 'REGULAR' | 'SPECIAL')}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">Regular Holiday</SelectItem>
                                        <SelectItem value="SPECIAL">Special Non-Working</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Update Holiday' : 'Create Holiday'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

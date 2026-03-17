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
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { PendingChangeItem } from '@/types/attendance.types'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function PendingChangesPage() {
    const { toast } = useToast()
    const [pending, setPending] = useState<PendingChangeItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const fetchPendingChanges = useCallback(async () => {
        setLoading(true)
        try {
            const data = await apiFetch<PendingChangeItem[]>('/pending-shift-assignments?status=PENDING')
            setPending(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load pending changes", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchPendingChanges()
    }, [fetchPendingChanges])
    
    const handleCancel = async (id: string) => {
        setSelectedId(id)
        setIsConfirmOpen(true)
    }

    const confirmCancel = async () => {
        if (!selectedId) return
        const id = selectedId
        setIsProcessing(true)
        try {
            await apiFetch(`/pending-shift-assignments/${id}`, { method: 'DELETE' })
            toast({ title: "Change Cancelled", variant: "success" })
            fetchPendingChanges()
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to cancel change", variant: "destructive" })
        } finally {
            setIsProcessing(false)
        }
    }

    const getDaysDisplay = (item: PendingChangeItem) => {
        const days = []
        if (item.isMon) days.push('M')
        if (item.isTue) days.push('T')
        if (item.isWed) days.push('W')
        if (item.isThu) days.push('Th')
        if (item.isFri) days.push('F')
        if (item.isSat) days.push('S')
        if (item.isSun) days.push('Su')
        return days.length === 7 ? 'Daily' : days.join('-') || 'None'
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pending Schedule Changes</h1>
                    <p className="text-muted-foreground">A global view of all upcoming shift assignment updates.</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="font-bold">EMPLOYEE</TableHead>
                                <TableHead className="font-bold">EFFECTIVE DATE</TableHead>
                                <TableHead className="font-bold">NEW SCHEDULE</TableHead>
                                <TableHead className="font-bold">DAYS</TableHead>
                                <TableHead className="text-right font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading pending changes...</TableCell></TableRow>
                            ) : pending.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No pending schedule changes found.</TableCell></TableRow>
                            ) : pending.map(item => (
                                <TableRow key={item.id} className="group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.employee.firstName} {item.employee.lastName}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{item.employee.employeeNo}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold">
                                            {format(new Date(item.effectiveDate), 'PP')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{item.startTime} - {item.endTime}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{item.breakMinutes}m break</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-bold text-[10px]">
                                            {getDaysDisplay(item)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleCancel(item.id)}>
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

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={confirmCancel}
                title="Cancel Pending Change"
                description="Are you sure you want to cancel this pending schedule change? This action cannot be undone."
                variant="destructive"
                loading={isProcessing}
            />
        </div>
    )
}

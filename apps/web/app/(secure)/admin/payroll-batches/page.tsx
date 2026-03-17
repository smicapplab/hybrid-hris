'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
import { Plus, Play, Calculator, Calendar, Clock, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import type { PayrollBatch } from '@/types/payroll.types'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function PayrollBatchesPage() {
    const { toast } = useToast()
    const [batches, setBatches] = useState<PayrollBatch[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
    })
    const [reProcessConfirmOpen, setReProcessConfirmOpen] = useState(false)
    const [batchToReProcess, setBatchToReProcess] = useState<string | null>(null)

    const fetchBatches = useCallback(async () => {
        try {
            const data = await apiFetch<PayrollBatch[]>('/payroll-batches')
            setBatches(data)
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to load payroll batches", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchBatches()
    }, [fetchBatches])

    const handleCreate = async () => {
        if (!formData.name || !formData.startDate || !formData.endDate) {
            toast({ title: "Validation Error", description: "All fields are required", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            await apiFetch('/payroll-batches', {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            toast({ title: "Batch Created", variant: "success" })
            setDialogOpen(false)
            fetchBatches()
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleProcess = async (id: string) => {
        setProcessingId(id)
        try {
            await apiFetch(`/payroll-batches/${id}/process`, { method: 'POST' })
            toast({
                title: "Payroll Processed",
                description: "All payslips have been generated successfully.",
                variant: "success"
            })
            fetchBatches()
        } catch (err: any) {
            toast({ title: "Processing Failed", description: err.message, variant: "destructive" })
        } finally {
            setProcessingId(null)
        }
    }

    const handleReProcess = async (id: string) => {
        setBatchToReProcess(id)
        setReProcessConfirmOpen(true)
    }

    const confirmReProcess = async () => {
        if (!batchToReProcess) return;
        const id = batchToReProcess;
        try {
            await apiFetch(`/payroll-batches/${id}/re-process`, { method: 'POST' })
            toast({
                title: "Payroll Re-processed",
                description: "All payslips have been recalculated successfully.",
                variant: "success"
            })
            fetchBatches()
        } catch (err: any) {
            toast({ title: "Re-processing Failed", description: err.message, variant: "destructive" })
        } finally {
            setProcessingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="outline" className="font-bold text-[10px] bg-slate-50 text-slate-600 border-slate-200">DRAFT</Badge>
            case 'PROCESSING': return <Badge variant="default" className="font-bold text-[10px] animate-pulse">PROCESSING</Badge>
            case 'COMPLETED': return <Badge variant="default" className="font-bold text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">COMPLETED</Badge>
            case 'VOID': return <Badge variant="destructive" className="font-bold text-[10px]">VOID</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Payroll Batches</h1>
                    <p className="text-sm text-slate-500 font-medium">Process and manage employee salary cycles.</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="font-bold gap-2">
                    <Plus className="w-4 h-4" />
                    Create Batch
                </Button>
            </div>

            <Card className="shadow-sm border-slate-200/60 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400">BATCH NAME</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400">PERIOD</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400 text-center">STATUS</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-400 text-right">TOTAL NET PAY</TableHead>
                                <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-400 w-40">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium">Loading batches...</TableCell></TableRow>
                            ) : batches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <Calendar className="w-8 h-8 opacity-20" />
                                            <span>No payroll batches created yet.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : batches.map(b => (
                                <TableRow key={b.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700">{b.name}</span>
                                            <span className="text-[10px] text-slate-400 tabular-nums">ID: {b.id.slice(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(b.status)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-slate-700">
                                        ₱{Number(b.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {b.status === 'DRAFT' && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="h-8 font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                                                onClick={() => handleProcess(b.id)}
                                                disabled={processingId === b.id}
                                            >
                                                {processingId === b.id ? (
                                                    <Clock className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Play className="w-3 h-3 fill-current" />
                                                )}
                                                {processingId === b.id ? 'Processing...' : 'Process'}
                                            </Button>
                                        )}
                                        {['COMPLETED', 'VOID', 'ERROR'].includes(b.status) && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 font-bold gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                    onClick={() => handleReProcess(b.id)}
                                                    disabled={processingId === b.id}
                                                >
                                                    {processingId === b.id ? (
                                                        <Clock className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="w-3 h-3" />
                                                    )}
                                                    {processingId === b.id ? 'Running...' : 'Re-run'}
                                                </Button>
                                                <Link href={`/admin/payroll-batches/${b.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 font-bold gap-2 border-slate-200 text-slate-600 hover:bg-slate-100">
                                                        <Calculator className="w-3 h-3" />
                                                        View Register
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px] border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800">
                            <Plus className="w-5 h-5 text-indigo-600" />
                            Create New Payroll Batch
                        </DialogTitle>
                        <DialogDescription>
                            Define the cutoff period for the upcoming payroll run.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        <RequiredInput
                            label="Batch Name"
                            placeholder="e.g. March 2026 - First Half"
                            value={formData.name}
                            onChangeAction={v => setFormData({ ...formData, name: v })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <RequiredInput
                                label="Cutoff Start"
                                type="date"
                                value={formData.startDate}
                                onChangeAction={v => setFormData({ ...formData, startDate: v })}
                            />
                            <RequiredInput
                                label="Cutoff End"
                                type="date"
                                value={formData.endDate}
                                onChangeAction={v => setFormData({ ...formData, endDate: v })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-4 border-t border-slate-100 rounded-b-lg">
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} className="font-semibold text-slate-500">Cancel</Button>
                        <Button onClick={handleCreate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-6 shadow-md">
                            {saving ? 'Creating...' : 'Create Batch'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={reProcessConfirmOpen}
                onOpenChange={setReProcessConfirmOpen}
                onConfirm={confirmReProcess}
                title="Re-run Payroll Batch"
                description="Are you sure you want to re-run this batch? This will overwrite all existing payslips in this batch. This action cannot be undone."
                confirmText="Re-run Batch"
                variant="destructive"
                loading={processingId !== null}
            />
        </div>
    )
}

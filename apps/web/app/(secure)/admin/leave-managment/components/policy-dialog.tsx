'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { LeavePolicy } from '@/types/leave.types'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    initialData?: LeavePolicy | null
    onSuccessAction: () => void
}

export function PolicyDialog({ open, onOpenChangeAction, initialData, onSuccessAction }: Props) {
    const { toast } = useToast()
    const isEdit = !!initialData

    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [description, setDescription] = useState('')
    const [effectiveFrom, setEffectiveFrom] = useState('')
    const [effectiveTo, setEffectiveTo] = useState('')
    const [loading, setLoading] = useState(false)
    const [touched, setTouched] = useState(false)

    useEffect(() => {
        if (initialData) {
            setName(initialData.name)
            setCode(initialData.code)
            setDescription(initialData.description ?? '')
            setEffectiveFrom(initialData.effectiveFrom)
            setEffectiveTo(initialData.effectiveTo ?? '')
        } else {
            setName('')
            setCode('')
            setDescription('')
            setEffectiveFrom('')
            setEffectiveTo('')
        }
        setTouched(false)
    }, [initialData, open])

    const isValid = name.trim() && code.trim() && effectiveFrom

    async function handleSubmit() {
        setTouched(true)
        if (!isValid) return

        try {
            setLoading(true)

            const body: Record<string, unknown> = {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description.trim() || undefined,
                effectiveFrom,
                effectiveTo: effectiveTo || null,
            }

            if (isEdit) {
                await apiFetch(`/leave-policies/${initialData!.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                })
                toast({ title: 'Policy updated', variant: 'success' })
            } else {
                await apiFetch('/leave-policies', {
                    method: 'POST',
                    body: JSON.stringify(body),
                })
                toast({ title: 'Policy created', variant: 'success' })
            }

            onOpenChangeAction(false)
            onSuccessAction()
        } catch (err) {
            toast({
                title: isEdit ? 'Failed to update policy' : 'Failed to create policy',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Policy' : 'New Leave Policy'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="pol-name">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="pol-name"
                            placeholder="e.g. Standard Leave Policy 2025"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={touched && !name.trim() ? 'border-destructive' : ''}
                        />
                        {touched && !name.trim() && <p className="text-xs text-destructive">Name is required.</p>}
                    </div>

                    {/* Code */}
                    <div className="space-y-1.5">
                        <Label htmlFor="pol-code">Code <span className="text-destructive">*</span></Label>
                        <Input
                            id="pol-code"
                            placeholder="e.g. SLP-2025"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className={`font-mono ${touched && !code.trim() ? 'border-destructive' : ''}`}
                        />
                        {touched && !code.trim() && <p className="text-xs text-destructive">Code is required.</p>}
                    </div>

                    {/* Effective dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="pol-from">Effective From <span className="text-destructive">*</span></Label>
                            <Input
                                id="pol-from"
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                className={touched && !effectiveFrom ? 'border-destructive' : ''}
                            />
                            {touched && !effectiveFrom && <p className="text-xs text-destructive">Required.</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="pol-to">Effective To</Label>
                            <Input
                                id="pol-to"
                                type="date"
                                value={effectiveTo}
                                onChange={(e) => setEffectiveTo(e.target.value)}
                                min={effectiveFrom}
                            />
                            <p className="text-xs text-muted-foreground">Leave blank for ongoing.</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="pol-desc">Description</Label>
                        <textarea
                            id="pol-desc"
                            placeholder="Optional description…"
                            value={description}
                            onChange={(e: { target: { value: string } }) => setDescription(e.target.value)}
                            rows={2}
                            className="resize-none text-sm w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>
                </div>

                <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

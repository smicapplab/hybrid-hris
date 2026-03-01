'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Position } from '@hybrid-hris/db/types'
import { RequiredInput } from '@/components/ui/required-input'

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    initialData?: Position | null
    onSuccessAction: () => void
}

export function PositionDialog({
    open,
    onOpenChangeAction,
    initialData,
    onSuccessAction,
}: Props) {
    const { toast } = useToast()

    const isEdit = !!initialData

    const [title, setTitle] = useState('')
    const [code, setCode] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [touched, setTouched] = useState(false)

    // Populate on edit
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title)
            setCode(initialData.code)
            setDescription(initialData.description ?? '')
        } else {
            setTitle('')
            setCode('')
            setDescription('')
        }
    }, [initialData, open])

    async function handleSubmit() {
        if (!title.trim() || !code.trim()) return

        try {
            setLoading(true)

            if (isEdit) {
                await apiFetch(`/positions/${initialData!.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ title, code, description }),
                })
                toast({ title: 'Position updated', variant: 'success' })
            } else {
                await apiFetch(`/positions`, {
                    method: 'POST',
                    body: JSON.stringify({ title, code, description }),
                })
                toast({ title: 'Position created', variant: 'success' })
            }

            onOpenChangeAction(false)
            onSuccessAction()
        } catch (err) {
            toast({
                title: isEdit ? 'Failed to update position' : 'Failed to create position',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Update Position' : 'Add Position'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <RequiredInput
                        label="Title"
                        value={title}
                        onChangeAction={(value: string) => setTitle(value)}
                        placeholder="e.g. Chief Executive Officer"
                        required
                        touched={touched}
                        errorMessage="Title is required."
                    />

                    <RequiredInput
                        label="Code"
                        value={code}
                        onChangeAction={(value: string) => setCode(value)}
                        placeholder="e.g. CEO"
                        required
                        touched={touched}
                        errorMessage="Code is required."
                        helperText="Unique internal identifier. Editable."
                    />

                    <RequiredInput
                        label="Description"
                        value={description}
                        onChangeAction={(value: string) => setDescription(value)}
                        placeholder="Optional description"
                    />
                </div>

                <div className="flex justify-between pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChangeAction(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={() => {
                            setTouched(true)
                            if (!title.trim() || !code.trim()) return
                            handleSubmit()
                        }}
                        disabled={loading || !title.trim() || !code.trim()}
                    >
                        {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
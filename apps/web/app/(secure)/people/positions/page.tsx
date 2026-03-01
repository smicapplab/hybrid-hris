'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { PositionListPanel } from './components/position-list-panel'
import { apiFetch } from "@/lib/api"
import { PositionDialog } from './components/position-dialog'
import { PositionDetailPanel } from './components/position-detail-panel'
import type { Position } from '@/types/position.types'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Briefcase } from 'lucide-react'

export default function PositionPage() {
    const { user } = useAuth()
    const { toast } = useToast()

    const [positions, setPositions] = useState<Position[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [showInactive, setShowInactive] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPosition, setEditingPosition] = useState<Position | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)

    const loadPositions = useCallback(async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams()
            if (!showInactive) params.append('active', 'true')
            if (search) params.append('search', search)

            const result = await apiFetch<Position[]>(
                `/positions?${params.toString()}`
            )

            setPositions(result)

            if (result.length === 0) {
                setSelectedId(null)
            } else if (!selectedId || !result.some(p => p.id === selectedId)) {
                setSelectedId(result[0].id)
            }
        } finally {
            setLoading(false)
        }
    }, [search, showInactive, selectedId])


    const handleDelete = (id: string) => {
        setDeleteId(id)
        setDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            await apiFetch(`/positions/${deleteId}`, {
                method: 'DELETE',
            })

            setDeleteOpen(false)
            setDeleteId(null)
            setSelectedId(null)
            await loadPositions()
            toast({ title: 'Position deleted', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to delete position',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    const handleRestore = async (id: string) => {
        try {
            await apiFetch(`/positions/${id}/restore`, {
                method: 'PATCH',
            })

            await loadPositions()
            setSelectedId(id)
            toast({ title: 'Position restored', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to restore position',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }


    useEffect(() => {
        if (!user) return
        loadPositions()
    }, [user, loadPositions])

    if (!user) return null

    return (
        <div className="p-6 h-full flex flex-col gap-4">
            {/* ── Page header ── */}
            <div>
                <h1 className="text-xl font-bold">Positions</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage job positions and assign them to org units.
                </p>
            </div>

            {/* ── Split panels ── */}
            <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 rounded-lg border">
                <ResizablePanel defaultSize={30} minSize={20}>
                    <PositionListPanel
                        positions={positions}
                        loading={loading}
                        search={search}
                        setSearchAction={setSearch}
                        showInactive={showInactive}
                        setShowInactiveAction={setShowInactive}
                        selectedId={selectedId}
                        onSelectAction={setSelectedId}
                        onAddAction={() => {
                            setEditingPosition(null)
                            setDialogOpen(true)
                        }}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70}>
                    <div className="h-full overflow-y-auto p-5">
                        {!selectedId ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">No position selected</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Select a position from the list to view its details.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <PositionDetailPanel
                                position={positions.find(p => p.id === selectedId)!}
                                onEditAction={() => {
                                    const pos = positions.find(p => p.id === selectedId)
                                    if (pos) {
                                        setEditingPosition(pos)
                                        setDialogOpen(true)
                                    }
                                }}
                                onDeleteAction={() => {
                                    if (!selectedId) return
                                    handleDelete(selectedId)
                                }}
                                onRestoreAction={() => {
                                    if (!selectedId) return
                                    handleRestore(selectedId)
                                }}
                            />
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Position</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this position? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PositionDialog
                open={dialogOpen}
                onOpenChangeAction={setDialogOpen}
                initialData={editingPosition}
                onSuccessAction={loadPositions}
            />
        </div>
    )
}
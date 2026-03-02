'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { CalendarDays } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { LeaveType } from '@/types/leave.types'
import { LeaveTypeListPanel } from './components/leave-type-list-panel'
import { LeaveTypeDetailPanel } from './components/leave-type-detail-panel'
import { LeaveTypeDialog } from './components/leave-type-dialog'

export default function LeaveTypesPage() {
    const { user } = useAuth()
    const { toast } = useToast()

    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [showDeleted, setShowDeleted] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingType, setEditingType] = useState<LeaveType | null>(null)
    const [archiveId, setArchiveId] = useState<string | null>(null)
    const [archiveOpen, setArchiveOpen] = useState(false)

    const loadLeaveTypes = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (showDeleted) params.append('includeDeleted', 'true')

            const result = await apiFetch<LeaveType[]>(`/leave-types?${params.toString()}`)
            setLeaveTypes(result)

            if (result.length === 0) {
                setSelectedId(null)
            } else if (!selectedId || !result.some((t) => t.id === selectedId)) {
                setSelectedId(result[0].id)
            }
        } finally {
            setLoading(false)
        }
    }, [search, showDeleted, selectedId])

    useEffect(() => {
        if (!user) return
        loadLeaveTypes()
    }, [user, loadLeaveTypes])

    const handleArchive = (id: string) => {
        setArchiveId(id)
        setArchiveOpen(true)
    }

    const confirmArchive = async () => {
        if (!archiveId) return
        try {
            await apiFetch(`/leave-types/${archiveId}`, { method: 'DELETE' })
            setArchiveOpen(false)
            setArchiveId(null)
            setSelectedId(null)
            await loadLeaveTypes()
            toast({ title: 'Leave type archived', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to archive leave type',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    const handleRestore = async (id: string) => {
        try {
            await apiFetch(`/leave-types/${id}/restore`, { method: 'PATCH' })
            await loadLeaveTypes()
            setSelectedId(id)
            toast({ title: 'Leave type restored', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to restore leave type',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    if (!user) return null

    const selected = leaveTypes.find((t) => t.id === selectedId)

    return (
        <div className="p-6 h-full flex flex-col gap-4">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold">Leave Types</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Define the types of leave available across your organization.
                </p>
            </div>

            {/* Split panels */}
            <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 rounded-lg border">
                <ResizablePanel defaultSize={30} minSize={20}>
                    <LeaveTypeListPanel
                        leaveTypes={leaveTypes}
                        loading={loading}
                        search={search}
                        setSearchAction={setSearch}
                        showDeleted={showDeleted}
                        setShowDeletedAction={setShowDeleted}
                        selectedId={selectedId}
                        onSelectAction={setSelectedId}
                        onAddAction={() => {
                            setEditingType(null)
                            setDialogOpen(true)
                        }}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70}>
                    <div className="h-full overflow-y-auto p-5">
                        {!selected ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">No leave type selected</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Select a leave type from the list to view its details.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <LeaveTypeDetailPanel
                                leaveType={selected}
                                onEditAction={() => {
                                    setEditingType(selected)
                                    setDialogOpen(true)
                                }}
                                onDeleteAction={() => handleArchive(selected.id)}
                                onRestoreAction={() => handleRestore(selected.id)}
                            />
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Archive confirmation */}
            <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Leave Type</AlertDialogTitle>
                        <AlertDialogDescription>
                            This leave type will be archived and hidden from active lists. You can restore it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmArchive}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Create / Edit dialog */}
            <LeaveTypeDialog
                open={dialogOpen}
                onOpenChangeAction={setDialogOpen}
                initialData={editingType}
                onSuccessAction={loadLeaveTypes}
            />
        </div>
    )
}

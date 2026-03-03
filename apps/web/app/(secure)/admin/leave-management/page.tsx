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
import { Sailboat } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { LeavePolicy, LeavePolicyWithRules, LeavePolicyRule } from '@/types/leave.types'
import { PolicyListPanel } from './components/policy-list-panel'
import { PolicyDetailPanel } from './components/policy-detail-panel'
import { PolicyDialog } from './components/policy-dialog'
import { RuleDialog } from './components/rule-dialog'

export default function LeaveManagmentPage() {
    const { user } = useAuth()
    const { toast } = useToast()

    // ── List state ───────────────────────────────────────────────────────────────
    const [policies, setPolicies] = useState<LeavePolicy[]>([])
    const [loadingList, setLoadingList] = useState(false)
    const [search, setSearch] = useState('')
    const [showInactive, setShowInactive] = useState(false)

    // ── Detail state ─────────────────────────────────────────────────────────────
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detailPolicy, setDetailPolicy] = useState<LeavePolicyWithRules | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    // ── Policy dialog ────────────────────────────────────────────────────────────
    const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
    const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null)

    // ── Toggle confirm ────────────────────────────────────────────────────────────
    const [toggleOpen, setToggleOpen] = useState(false)

    // ── Rule dialog ───────────────────────────────────────────────────────────────
    const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<LeavePolicyRule | null>(null)

    // ── Remove rule confirm ───────────────────────────────────────────────────────
    const [removeRuleId, setRemoveRuleId] = useState<string | null>(null)
    const [removeRuleOpen, setRemoveRuleOpen] = useState(false)

    // ── Load list ─────────────────────────────────────────────────────────────────
    const loadPolicies = useCallback(async () => {
        try {
            setLoadingList(true)
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (!showInactive) params.append('active', 'true')

            const result = await apiFetch<LeavePolicy[]>(`/leave-policies?${params.toString()}`)
            setPolicies(result)

            if (result.length === 0) {
                setSelectedId(null)
            } else if (!selectedId || !result.some((p) => p.id === selectedId)) {
                setSelectedId(result[0].id)
            }
        } finally {
            setLoadingList(false)
        }
    }, [search, showInactive, selectedId])

    // ── Load detail ───────────────────────────────────────────────────────────────
    const loadDetail = useCallback(async (id: string) => {
        try {
            setLoadingDetail(true)
            const result = await apiFetch<LeavePolicyWithRules>(`/leave-policies/${id}`)
            setDetailPolicy(result)
        } catch {
            setDetailPolicy(null)
        } finally {
            setLoadingDetail(false)
        }
    }, [])

    useEffect(() => {
        if (!user) return
        loadPolicies()
    }, [user, loadPolicies])

    useEffect(() => {
        if (!selectedId) { setDetailPolicy(null); return }
        loadDetail(selectedId)
    }, [selectedId, loadDetail])

    // ── Toggle active ─────────────────────────────────────────────────────────────
    const confirmToggleActive = async () => {
        if (!detailPolicy) return
        try {
            if (detailPolicy.isActive) {
                await apiFetch(`/leave-policies/${detailPolicy.id}`, { method: 'DELETE' })
                toast({ title: 'Policy deactivated', variant: 'success' })
            } else {
                await apiFetch(`/leave-policies/${detailPolicy.id}/activate`, { method: 'PATCH' })
                toast({ title: 'Policy activated', variant: 'success' })
            }
            setToggleOpen(false)
            await loadPolicies()
            await loadDetail(detailPolicy.id)
        } catch (err) {
            toast({
                title: 'Failed to update policy status',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    // ── Set default ───────────────────────────────────────────────────────────────
    const handleSetDefault = async () => {
        if (!detailPolicy) return
        try {
            await apiFetch(`/leave-policies/${detailPolicy.id}/set-default`, { method: 'PATCH' })
            toast({ title: 'Default policy updated', variant: 'success' })
            await loadPolicies()
            await loadDetail(detailPolicy.id)
        } catch (err) {
            toast({
                title: 'Failed to set default policy',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    // ── Remove rule ───────────────────────────────────────────────────────────────
    const confirmRemoveRule = async () => {
        if (!detailPolicy || !removeRuleId) return
        try {
            await apiFetch(`/leave-policies/${detailPolicy.id}/rules/${removeRuleId}`, { method: 'DELETE' })
            setRemoveRuleOpen(false)
            setRemoveRuleId(null)
            await loadDetail(detailPolicy.id)
            toast({ title: 'Rule removed', variant: 'success' })
        } catch (err) {
            toast({
                title: 'Failed to remove rule',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        }
    }

    if (!user) return null

    return (
        <div className="p-6 h-full flex flex-col gap-4">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold">Leave Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Configure leave policies and entitlement rules for your organization.
                </p>
            </div>

            {/* Split panels */}
            <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 rounded-lg border">
                <ResizablePanel defaultSize={30} minSize={20}>
                    <PolicyListPanel
                        policies={policies}
                        loading={loadingList}
                        search={search}
                        setSearchAction={setSearch}
                        showInactive={showInactive}
                        setShowInactiveAction={setShowInactive}
                        selectedId={selectedId}
                        onSelectAction={setSelectedId}
                        onAddAction={() => {
                            setEditingPolicy(null)
                            setPolicyDialogOpen(true)
                        }}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70}>
                    <div className="h-full overflow-y-auto p-5">
                        {!selectedId || !detailPolicy ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <Sailboat className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {loadingDetail ? 'Loading…' : 'No policy selected'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Select a policy from the list to view its details and rules.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <PolicyDetailPanel
                                policy={detailPolicy}
                                onEditPolicyAction={() => {
                                    setEditingPolicy(detailPolicy)
                                    setPolicyDialogOpen(true)
                                }}
                                onToggleActiveAction={() => setToggleOpen(true)}
                                onSetDefaultAction={handleSetDefault}
                                onAddRuleAction={() => {
                                    setEditingRule(null)
                                    setRuleDialogOpen(true)
                                }}
                                onEditRuleAction={(rule) => {
                                    setEditingRule(rule)
                                    setRuleDialogOpen(true)
                                }}
                                onRemoveRuleAction={(ruleId) => {
                                    setRemoveRuleId(ruleId)
                                    setRemoveRuleOpen(true)
                                }}
                            />
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Deactivate / Activate confirm */}
            <AlertDialog open={toggleOpen} onOpenChange={setToggleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {detailPolicy?.isActive ? 'Deactivate Policy' : 'Activate Policy'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {detailPolicy?.isActive
                                ? 'This policy will be deactivated. Employees assigned to it will no longer accrue leave.'
                                : 'This policy will be reactivated and available for assignment.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmToggleActive}
                            className={detailPolicy?.isActive
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                : ''}
                        >
                            {detailPolicy?.isActive ? 'Deactivate' : 'Activate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove rule confirm */}
            <AlertDialog open={removeRuleOpen} onOpenChange={setRemoveRuleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Rule</AlertDialogTitle>
                        <AlertDialogDescription>
                            This rule will be permanently removed from the policy. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRemoveRule}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Policy create / edit dialog */}
            <PolicyDialog
                open={policyDialogOpen}
                onOpenChangeAction={setPolicyDialogOpen}
                initialData={editingPolicy}
                onSuccessAction={async () => {
                    await loadPolicies()
                    if (editingPolicy) await loadDetail(editingPolicy.id)
                }}
            />

            {/* Rule add / edit dialog */}
            {selectedId && (
                <RuleDialog
                    open={ruleDialogOpen}
                    onOpenChangeAction={setRuleDialogOpen}
                    policyId={selectedId}
                    initialData={editingRule}
                    onSuccessAction={() => loadDetail(selectedId)}
                />
            )}
        </div>
    )
}

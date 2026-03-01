'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrgTree } from './components/org-tree';
import { OrgDetailsPanel } from './components/org-details-panel';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { OrgUnitNode } from '@/types/org-unit.type';
import { OrgUnitDialog } from './components/org-unit-dialog';

export default function OrgStructurePage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [orgTree, setOrgTree] = useState<OrgUnitNode[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<OrgUnitNode | null>(null);
    const [editingOrg, setEditingOrg] = useState<OrgUnitNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleted, setShowDeleted] = useState(false);
    const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [parentForCreate, setParentForCreate] = useState<OrgUnitNode | null>(null);

    const refreshTree = useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiFetch<OrgUnitNode[]>(
                `/org-units/tree?showDeleted=${showDeleted}`
            );
            setOrgTree(result);

            setSelectedOrg((prev) => {
                if (!prev) return result.length > 0 ? result[0] : null;
                return prev;
            });

            return result;
        } finally {
            setLoading(false);
        }
    }, [showDeleted]);

    useEffect(() => {
        if (user) {
            refreshTree();
        }
    }, [user, refreshTree]);

    const handleDelete = async (org: OrgUnitNode) => {
        try {
            await apiFetch(`/org-units/${org.id}`, {
                method: 'DELETE',
            });

            await refreshTree();

            // select first available node after delete
            setSelectedOrg((prev) => {
                if (!prev || prev.id !== org.id) return prev;
                return orgTree.length > 0 ? orgTree[0] : null;
            });

            toast({ title: 'Unit deleted', variant: 'success' });
        } catch (err) {
            toast({
                title: 'Failed to delete unit',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleRestore = async (org: OrgUnitNode) => {
        try {
            await apiFetch(`/org-units/${org.id}/restore`, {
                method: 'PATCH',
            });

            const updatedTree = await refreshTree();

            if (!updatedTree) return;

            const findNode = (nodes: OrgUnitNode[]): OrgUnitNode | null => {
                for (const node of nodes) {
                    if (node.id === org.id) return node;
                    if (node.children?.length) {
                        const found = findNode(node.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const restored = findNode(updatedTree);
            if (restored) {
                setSelectedOrg(restored);
            }

            toast({ title: 'Unit restored', variant: 'success' });
        } catch (err) {
            toast({
                title: 'Failed to restore unit',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleAddChild = (parent: OrgUnitNode) => {
        setParentForCreate(parent);
        setEditingOrg(null);
        setDialogMode('create');
        setDialogOpen(true);
    };

    const handleEdit = (org: OrgUnitNode) => {
        setEditingOrg(org);
        setDialogMode('edit');
        setParentForCreate(null);
        setDialogOpen(true);
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64 text-sm text-muted-foreground">
                Loading organization…
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col gap-4">
            {/* Page header */}
            <div className="flex items-center justify-between ">
                <div>
                    <h1 className="text-xl font-bold">Organization Structure</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage org units, leadership, and assigned positions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={showDeleted}
                            onCheckedChange={setShowDeleted}
                        />
                        <Label className="text-sm">Show Deleted</Label>
                    </div>
                </div>
            </div>

            <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
                <ResizablePanel defaultSize={28} minSize={18} className="flex flex-col">
                    {/* Tree panel header */}
                    <div className="px-3 py-2.5 border-b bg-muted/30 ">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Units
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto py-2">
                        {orgTree.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No organization units found.
                            </div>
                        ) : (
                            <OrgTree
                                data={orgTree}
                                selectedId={selectedOrg?.id}
                                openNodes={openNodes}
                                setOpenNodes={setOpenNodes}
                                onSelectAction={(node) => setSelectedOrg(node)}
                            />
                        )}
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={72} className="overflow-y-auto p-5">
                    <OrgDetailsPanel
                        org={selectedOrg}
                        onEditAction={handleEdit}
                        onDeleteAction={handleDelete}
                        onRestoreAction={handleRestore}
                        onAddChildAction={handleAddChild}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
            <OrgUnitDialog
                key={`${dialogMode}-${editingOrg?.id ?? 'new'}-${parentForCreate?.id ?? 'root'}`}
                open={dialogOpen}
                onClose={async () => {
                    setDialogOpen(false);
                    await refreshTree();
                }}
                initialData={dialogMode === 'edit' ? editingOrg ?? null : null}
                parentId={parentForCreate?.id ?? null}
            />
        </div>
    );
}

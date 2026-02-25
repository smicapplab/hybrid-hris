'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { OrgTree } from './components/org-tree';
import { OrgDetailsPanel } from './components/org-details-panel';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { OrgUnitNode } from '@/types/org-unit.type';
import { OrgUnitDialog } from './components/org-unit-dialog';

export default function OrgStructurePage() {
    const { user } = useAuth();

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
        await apiFetch(`/org-units/${org.id}`, {
            method: 'DELETE',
        });

        await refreshTree();

        // select first available node after delete
        setSelectedOrg((prev) => {
            if (!prev || prev.id !== org.id) return prev;
            return orgTree.length > 0 ? orgTree[0] : null;
        });
    };

    const handleRestore = async (org: OrgUnitNode) => {
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
        return <div className="p-8">Loading organization...</div>;
    }

    return (
        <div className="p-8 h-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={showDeleted}
                            onCheckedChange={setShowDeleted}
                        />
                        <Label>Show Deleted</Label>
                    </div>
                </div>
            </div>

            <ResizablePanelGroup orientation="horizontal" className="h-[75vh]">
                <ResizablePanel defaultSize={30} minSize={20}>
                    {orgTree.length === 0 ? (
                        <div className="text-muted-foreground">
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
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={70} className="p-4">
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
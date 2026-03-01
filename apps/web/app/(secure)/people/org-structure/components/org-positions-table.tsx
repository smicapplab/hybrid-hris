'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { Position } from '@hybrid-hris/db/types';

interface OrgPositionsTableProps {
    orgId: string;
    onChangeAction?: () => void;
}

export function OrgPositionsTable({ orgId, onChangeAction }: OrgPositionsTableProps) {
    const { toast } = useToast()

    const [positions, setPositions] = useState<Position[]>([]);
    const [allPositions, setAllPositions] = useState<Position[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [removeId, setRemoveId] = useState<string | null>(null);
    const [openAdd, setOpenAdd] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const data = await apiFetch<Position[]>(`/org-units/${orgId}/positions`);
            setPositions(data);
        } finally {
            setLoading(false);
        }
    }

    async function loadAllPositions() {
        const data = await apiFetch<Position[]>(`/positions?active=true`);
        setAllPositions(data);
    }

    useEffect(() => {
        if (orgId) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    async function handleRemove(positionId: string) {
        try {
            await apiFetch(`/org-units/${orgId}/positions/${positionId}`, {
                method: 'DELETE',
            });
            setRemoveId(null);
            await load();
            onChangeAction?.();
            toast({ title: 'Position removed', variant: 'success' });
        } catch (err) {
            setRemoveId(null);
            toast({
                title: 'Failed to remove position',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            });
        }
    }

    async function handleAdd() {
        try {
            for (const id of selectedIds) {
                await apiFetch(`/org-units/${orgId}/positions`, {
                    method: 'POST',
                    body: JSON.stringify({ positionId: id }),
                });
            }
            setSelectedIds([]);
            setOpenAdd(false);
            await load();
            onChangeAction?.();
            toast({ title: 'Position(s) added', variant: 'success' });
        } catch (err) {
            toast({
                title: 'Failed to add position',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            });
        }
    }

    const assignedIds = new Set(positions.map(p => p.id));

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading positions...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold">Positions</h3>
                <Button
                    size="sm"
                    onClick={async () => {
                        await loadAllPositions();
                        setOpenAdd(true);
                    }}
                >
                    + Add Position
                </Button>
            </div>

            {positions.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                    No positions assigned to this org unit.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-30">Code</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="w-30 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {positions.map((pos) => (
                            <TableRow key={pos.id}>
                                <TableCell className="font-mono text-xs">{pos.code}</TableCell>
                                <TableCell>{pos.title}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setRemoveId(pos.id)}
                                    >
                                        Remove
                                    </Button>

                                    <AlertDialog
                                        open={removeId === pos.id}
                                        onOpenChange={(open) => !open && setRemoveId(null)}
                                    >
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Remove Position from Org?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will unassign <strong>{pos.title}</strong> from this org unit.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleRemove(pos.id)}
                                                >
                                                    Confirm
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Positions</DialogTitle>
                    </DialogHeader>

                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder="Search positions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {allPositions
                            .filter(p => !assignedIds.has(p.id))
                            .filter(p =>
                                p.title.toLowerCase().includes(search.toLowerCase()) ||
                                p.code.toLowerCase().includes(search.toLowerCase())
                            )
                            .map((pos) => (
                                <div key={pos.id} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedIds.includes(pos.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedIds(prev => [...prev, pos.id]);
                                            } else {
                                                setSelectedIds(prev => prev.filter(id => id !== pos.id));
                                            }
                                        }}
                                    />
                                    <span className="text-sm">
                                        {pos.title} ({pos.code})
                                    </span>
                                </div>
                            ))}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setOpenAdd(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={selectedIds.length === 0}>
                            Add Selected
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
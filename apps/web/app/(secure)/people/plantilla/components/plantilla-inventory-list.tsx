'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UpdateLimitDialog } from './update-limit-dialog';
import { formatNumber } from '@/lib/helpers';

interface OrgPlantillaItem {
    orgUnitId: string;
    orgUnitName: string;
    orgUnitCode: string;
    positionId: string;
    positionTitle: string;
    positionCode: string;
    headcountLimit: number;
    filledCount: number;
    requestedCount: number;
    approvedCount: number;
    availableCount: number;
}

export function PlantillaInventoryList() {
    const { user } = useAuth();
    const [items, setItems] = useState<OrgPlantillaItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Dialog state
    const [editItem, setEditItem] = useState<OrgPlantillaItem | null>(null);

    const isPowerUser = user?.roles.includes('ADMIN') || user?.roles.includes('HR_ADMIN') || user?.isRootLeader;

    async function load() {
        setLoading(true);
        try {
            const data = await apiFetch<OrgPlantillaItem[]>('/manpower/plantilla/flat');
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    if (loading) return <div>Loading inventory...</div>;

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Organization Unit</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead className="w-32 text-center">Utilization</TableHead>
                        <TableHead className="w-20 text-center">Limit</TableHead>
                        <TableHead className="w-20 text-center">Filled</TableHead>
                        <TableHead className="w-20 text-center text-primary font-bold">Avail.</TableHead>
                        {isPowerUser && <TableHead className="w-16"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, idx) => {
                         const utilization = item.headcountLimit > 0
                            ? (item.filledCount / item.headcountLimit) * 100
                            : 0;
                        return (
                            <TableRow key={`${item.orgUnitId}-${item.positionId}-${idx}`}>
                                <TableCell>
                                    <div className="font-medium text-sm">{item.orgUnitName}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{item.orgUnitCode}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-sm">{item.positionTitle}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{item.positionCode}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress value={utilization} className="h-1.5" />
                                        <span className="text-[10px] text-muted-foreground w-8 text-right">
                                            {Math.round(utilization)}%
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center text-xs font-medium">
                                    {formatNumber(item.headcountLimit)}
                                </TableCell>
                                <TableCell className="text-center text-xs">
                                    {formatNumber(item.filledCount)}
                                </TableCell>
                                <TableCell className={`text-center text-xs ${item.requestedCount > 0 ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                                    {item.requestedCount > 0 ? formatNumber(item.requestedCount) : '-'}
                                </TableCell>
                                <TableCell className={`text-center text-xs ${item.approvedCount > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                    {item.approvedCount > 0 ? formatNumber(item.approvedCount) : '-'}
                                </TableCell>
                                <TableCell className={`text-center text-sm font-bold ${item.availableCount > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                    {formatNumber(item.availableCount)}
                                </TableCell>
                                {isPowerUser && (
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0"
                                            onClick={() => setEditItem(item)}
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {editItem && (
                <UpdateLimitDialog
                    open={!!editItem}
                    onClose={() => setEditItem(null)}
                    orgUnitId={editItem.orgUnitId}
                    positionId={editItem.positionId}
                    positionTitle={`${editItem.positionTitle} (${editItem.orgUnitName})`}
                    currentLimit={editItem.headcountLimit}
                    onSuccessAction={load}
                />
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { OrgUnitNode } from '@/types/org-unit.type';
import { formatNumber } from '@/lib/helpers';

interface OrgPlantillaTableProps {
    org: OrgUnitNode | null;
}

interface PlantillaItem {
    orgUnitId: string;
    positionId: string;
    positionTitle: string;
    positionCode: string;
    headcountLimit: number;
    filledCount: number;
    vacantCount: number;
    requestedCount: number;
    approvedCount: number;
    availableCount: number;
}

export function OrgPlantillaTable({ org }: OrgPlantillaTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [plantilla, setPlantilla] = useState<PlantillaItem[]>([]);
    const [loading, setLoading] = useState(false);

    async function load() {
        if (!org) return;
        setLoading(true);
        try {
            const data = await apiFetch<PlantillaItem[]>(`/manpower/plantilla/inventory/${org.id}`);
            setPlantilla(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [org?.id]);

    if (!org) {
        return <div className="text-center text-muted-foreground py-8">Select an organization unit</div>;
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading plantilla...</div>;
    }

    const handleRefill = (item: PlantillaItem) => {
        router.push(`/people/plantilla/requests/new?orgUnitId=${org?.id}&positionId=${item.positionId}&returnTo=${encodeURIComponent(pathname)}`);
    };

    const handleNew = () => {
        router.push(`/people/plantilla/requests/new?orgUnitId=${org?.id}&returnTo=${encodeURIComponent(pathname)}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold">Plantilla & Headcount</h3>
                <Button size="sm" onClick={handleNew} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Request New Headcount
                </Button>
            </div>

            {plantilla.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-8 text-center bg-muted/20">
                    No positions or headcount limits defined for this unit.
                </div>
            ) : (
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Position</TableHead>
                                <TableHead className="w-32 text-center">Utilization</TableHead>
                                <TableHead className="w-20 text-center">Limit</TableHead>
                                <TableHead className="w-20 text-center">Filled</TableHead>
                                <TableHead className="w-20 text-center">Req.</TableHead>
                                <TableHead className="w-20 text-center">Appr.</TableHead>
                                <TableHead className="w-20 text-center text-primary font-bold">Avail.</TableHead>
                                <TableHead className="w-20"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plantilla.map((item) => {
                                const utilization = item.headcountLimit > 0
                                    ? (item.filledCount / item.headcountLimit) * 100
                                    : 0;
                                const isOverLimit = item.filledCount > item.headcountLimit;
                                
                                return (
                                    <TableRow key={item.positionId}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{item.positionTitle}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{item.positionCode}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress 
                                                    value={utilization} 
                                                    className={`h-1.5 ${isOverLimit ? 'bg-red-100' : ''}`} 
                                                />
                                                <span className="text-[10px] text-muted-foreground w-8 text-right">
                                                    {Math.round(utilization)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-xs">
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
                                        <TableCell className="text-right">
                                            {item.availableCount > 0 && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 p-0"
                                                    title="Request Refill"
                                                    onClick={() => handleRefill(item)}
                                                >
                                                    <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

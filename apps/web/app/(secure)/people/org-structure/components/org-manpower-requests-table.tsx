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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Check, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrgManpowerRequestsTableProps {
    orgId: string;
    onChangeAction?: () => void;
}

interface ManpowerRequestItem {
    id: string;
    jobTitle: string;
    requestType: string;
    quantity: number;
    employmentType: string;
    priority: string;
    status: string;
    requestedBy: string;
    requestedByFirstName: string;
    requestedByLastName: string;
    createdAt: string;
    currentApproverUserId: string | null;
}

interface PaginatedResponse {
    items: ManpowerRequestItem[];
    total: number;
}

export function OrgManpowerRequestsTable({ orgId, onChangeAction }: OrgManpowerRequestsTableProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [requests, setRequests] = useState<ManpowerRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'active' | 'history'>('active');

    async function load() {
        setLoading(true);
        try {
            const isHistory = tab === 'history';
            const data = await apiFetch<PaginatedResponse>(`/manpower/requests?orgUnitId=${orgId}&limit=100&isHistory=${isHistory}`);
            setRequests(data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (orgId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, tab]);

    async function handleSubmit(id: string) {
        try {
            await apiFetch(`/manpower/requests/${id}/submit`, { method: 'POST' });
            toast({ title: 'Request submitted for approval', variant: 'success' });
            load();
            onChangeAction?.();
        } catch (err) {
            toast({
                title: 'Submission failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive'
            });
        }
    }

    async function handleApprove(id: string) {
        try {
            await apiFetch(`/manpower/requests/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ status: 'APPROVED' }),
            });
            toast({ title: 'Request approved', variant: 'success' });
            load();
            onChangeAction?.();
        } catch (err) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to approve',
                variant: 'destructive',
            });
        }
    }

    async function handleReject(id: string) {
        try {
            await apiFetch(`/manpower/requests/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ status: 'REJECTED' }),
            });
            toast({ title: 'Request rejected', variant: 'default' });
            load();
            onChangeAction?.();
        } catch (err) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to reject',
                variant: 'destructive',
            });
        }
    }

    if (loading) return <div className="text-sm text-muted-foreground">Loading requests...</div>;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold">Manpower Requests</h3>
                <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'history')} className="space-y-4">
                    <TabsList>
                        <TabsTrigger 
                            value="active"
                        >
                            Active
                        </TabsTrigger>
                        <TabsTrigger 
                            value="history"
                        >
                            History
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {requests.length === 0 ? (
                <div className="text-[11px] text-muted-foreground italic py-2">
                    No {tab} requests for this unit.
                </div>
            ) : (
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="text-[11px] h-8">Job Title</TableHead>
                                <TableHead className="text-[11px] h-8 text-center">Qty</TableHead>
                                <TableHead className="text-[11px] h-8">Status</TableHead>
                                <TableHead className="text-[11px] h-8">Date</TableHead>
                                {tab === 'active' && <TableHead className="text-[11px] h-8 text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow 
                                    key={req.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => router.push(`/people/plantilla/requests/${req.id}/edit?returnTo=${encodeURIComponent(pathname)}`)}
                                >
                                    <TableCell className="py-2">
                                        <div className="text-sm font-medium">{req.jobTitle}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase">{req.employmentType}</div>
                                    </TableCell>
                                    <TableCell className="text-center py-2">{req.quantity}</TableCell>
                                    <TableCell className="py-2">
                                        <Badge 
                                            variant="outline" 
                                            className={`text-[10px] px-1.5 py-0 h-5 ${
                                                req.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                req.status === 'REJECTED' ? 'border-red-200 bg-red-50 text-red-700' :
                                                req.status === 'DRAFT' ? 'border-slate-200 bg-slate-50 text-slate-600' :
                                                'border-blue-200 bg-blue-50 text-blue-700'
                                            }`}
                                        >
                                            {req.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground py-2">
                                        {format(new Date(req.createdAt), 'MMM d')}
                                    </TableCell>
                                    {tab === 'active' && (
                                        <TableCell className="text-right py-2 space-x-1">
                                            {req.status === 'DRAFT' && req.requestedBy === user?.id && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-7 gap-1.5 text-[10px]"
                                                    onClick={(e) => { e.stopPropagation(); handleSubmit(req.id); }}
                                                >
                                                    <Send className="w-3 h-3" />
                                                    Submit
                                                </Button>
                                            )}
                                            {(req.status === 'SUBMITTED' || req.status === 'SUBMITTED_TO_ROOT') && req.currentApproverUserId === user?.id && (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-7 w-7 p-0" 
                                                        onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                                                    >
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-7 w-7 p-0" 
                                                        onClick={(e) => { e.stopPropagation(); handleReject(req.id); }}
                                                    >
                                                        <X className="w-3 h-3 text-red-600" />
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

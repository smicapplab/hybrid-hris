'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ManpowerRequestItem {
    id: string;
    orgUnitName: string;
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

export function ManpowerRequestsList() {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    // State
    const [requests, setRequests] = useState<ManpowerRequestItem[]>([]);
    const [total, setTotal] = useState(0);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'active' | 'history'>('active');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const isHistory = tab === 'history';
            const query = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                isHistory: isHistory.toString(),
                search: search,
            });
            const data = await apiFetch<PaginatedResponse>(`/manpower/requests?${query.toString()}`);
            setRequests(data.items);
            setTotal(data.total);

            // Peek at history total if we're on the active tab
            if (!isHistory) {
                const hQuery = new URLSearchParams({ page: '1', limit: '1', isHistory: 'true' });
                const hData = await apiFetch<PaginatedResponse>(`/manpower/requests?${hQuery.toString()}`);
                setHistoryTotal(hData.total);
            } else {
                setHistoryTotal(data.total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tab, page, search]);

    useEffect(() => {
        load();
    }, [load]);

    // Handle Tab Change
    const handleTabChange = (val: string) => {
        setTab(val as 'active' | 'history');
        setPage(1);
    };

    // Handle Actions
    async function handleApprove(id: string) {
        try {
            await apiFetch(`/manpower/requests/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ status: 'APPROVED' }),
            });
            toast({ title: 'Request approved', variant: 'success' });
            load();
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
        } catch (err) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to reject',
                variant: 'destructive',
            });
        }
    }

    async function handleSubmit(id: string) {
        try {
            await apiFetch(`/manpower/requests/${id}/submit`, {
                method: 'POST',
            });
            toast({ title: 'Request submitted', variant: 'success' });
            load();
        } catch (err) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to submit',
                variant: 'destructive',
            });
        }
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Tabs value={tab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                    <TabsList className={`grid w-full ${historyTotal > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        {historyTotal > 0 && <TabsTrigger value="history">History</TabsTrigger>}
                    </TabsList>
                </Tabs>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search job title..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Date</TableHead>
                            {tab === 'active' && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={tab === 'active' ? 8 : 7} className="text-center py-8">Loading requests...</TableCell>
                            </TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={tab === 'active' ? 8 : 7} className="text-center py-8 text-muted-foreground">
                                    No {tab} manpower requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow 
                                    key={req.id} 
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => router.push(`/people/plantilla/requests/${req.id}/edit?returnTo=${encodeURIComponent(pathname)}`)}
                                >
                                    <TableCell className="font-medium">
                                        {req.jobTitle}
                                        <div className="text-xs text-muted-foreground">
                                            {req.quantity} x {req.employmentType}
                                        </div>
                                    </TableCell>
                                    <TableCell>{req.orgUnitName}</TableCell>
                                    <TableCell className="text-xs">{req.requestType.replace('_', ' ')}</TableCell>
                                    <TableCell>
                                        <Badge variant={req.priority === 'URGENT' || req.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                                            {req.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'APPROVED' ? 'default' : (req.status === 'REJECTED' ? 'destructive' : 'outline')}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {req.requestedByFirstName} {req.requestedByLastName}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(req.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    {tab === 'active' && (
                                        <TableCell className="text-right space-x-2">
                                            {req.status === 'DRAFT' && req.requestedBy === user?.id && (
                                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleSubmit(req.id); }}>
                                                    Submit
                                                </Button>
                                            )}
                                            {(req.status === 'SUBMITTED' || req.status === 'SUBMITTED_TO_ROOT') && req.currentApproverUserId === user?.id && (
                                                <>
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}>
                                                        <Check className="w-4 h-4 text-green-600" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleReject(req.id); }}>
                                                        <X className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-xs text-muted-foreground">
                        Showing {requests.length} of {total} results
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-medium">
                            Page {page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

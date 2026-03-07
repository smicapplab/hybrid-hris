'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { PendingApprovalItem, formatDateRange } from '@/types/leave-requests.types'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ClipboardCheck,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    History,
    MessageSquare,
    User,
    Search,
    ChevronLeft,
    ChevronRight,
    Wallet,
} from 'lucide-react'
import ActOnRequestDialog from '../../me/my-leave-requests/components/act-on-request-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
        APPROVED: 'bg-green-50 text-green-700 border-green-200',
        REJECTED: 'bg-red-50 text-red-700 border-red-200',
        CANCELLED: 'bg-gray-50 text-gray-700 border-gray-200',
    }

    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider',
            variants[status] || 'bg-gray-50 text-gray-600 border-gray-200'
        )}>
            {status}
        </span>
    )
}

export default function LeaveApprovalsPage() {
    const [pending, setPending] = useState<PendingApprovalItem[]>([])
    const [pendingTotal, setPendingTotal] = useState(0)
    const [pendingPage, setPendingPage] = useState(1)
    const [pendingSearch, setPendingSearch] = useState('')

    const [history, setHistory] = useState<PendingApprovalItem[]>([])
    const [historyTotal, setHistoryTotal] = useState(0)
    const [historyPage, setHistoryPage] = useState(1)
    const [historySearch, setHistorySearch] = useState('')

    const [pendingLoading, setPendingLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(true)
    const [selected, setSelected] = useState<PendingApprovalItem | null>(null)
    const [action, setAction] = useState<'approve' | 'reject'>('approve')
    const [dialogOpen, setDialogOpen] = useState(false)

    const limit = 10

    const loadPending = useCallback(async (page: number, search: string) => {
        setPendingLoading(true)
        try {
            const data = await apiFetch<{ items: PendingApprovalItem[], total: number }>('/leave-requests/pending-approval', {
                params: { page, limit, search }
            })
            setPending(data?.items ?? [])
            setPendingTotal(data?.total ?? 0)
        } catch (error) {
            console.error('Failed to load pending leave data:', error)
            setPending([])
        } finally {
            setPendingLoading(false)
        }
    }, [])

    const loadHistory = useCallback(async (page: number, search: string) => {
        setHistoryLoading(true)
        try {
            const data = await apiFetch<{ items: PendingApprovalItem[], total: number }>('/leave-requests/team-history', {
                params: { page, limit, search }
            })
            setHistory(data?.items ?? [])
            setHistoryTotal(data?.total ?? 0)
        } catch (error) {
            console.error('Failed to load leave history data:', error)
            setHistory([])
        } finally {
            setHistoryLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPending(pendingPage, pendingSearch)
        }, 300)
        return () => clearTimeout(timer)
    }, [loadPending, pendingPage, pendingSearch])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadHistory(historyPage, historySearch)
        }, 300)
        return () => clearTimeout(timer)
    }, [loadHistory, historyPage, historySearch])

    const handleAction = (item: PendingApprovalItem, act: 'approve' | 'reject') => {
        setSelected(item)
        setAction(act)
        setDialogOpen(true)
    }

    const renderPagination = (total: number, currentPage: number, onPageChange: (page: number) => void) => {
        const totalPages = Math.ceil(total / limit)
        if (totalPages <= 1) return null

        return (
            <div className="flex items-center justify-between px-2 py-4 border-t">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * limit, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    const renderTable = (items: PendingApprovalItem[] = [], isHistory = false) => {
        const loading = isHistory ? historyLoading : pendingLoading

        if ((!items || items.length === 0) && !loading) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        {isHistory ? <History className="w-8 h-8 text-gray-300" /> : <CheckCircle2 className="w-8 h-8 text-green-500" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                        {isHistory ? 'No history found' : 'All caught up!'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xs mt-1">
                        {isHistory
                            ? 'No past leave requests found for your team.'
                            : 'There are no pending leave requests that require your action right now.'}
                    </p>
                </div>
            )
        }

        return (
            <div className="rounded-md border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="w-[250px]">Employee</TableHead>
                            <TableHead>Type & Period</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Balance</TableHead>
                            {isHistory ? (
                                <>
                                    <TableHead>Your Action</TableHead>
                                    <TableHead>Processed At</TableHead>
                                </>
                            ) : (
                                <TableHead>Submitted</TableHead>
                            )}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={isHistory ? 7 : 6}>
                                        <Skeleton className="h-12 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-semibold text-xs border border-indigo-100 uppercase">
                                                {item.employeeFirstName[0]}{item.employeeLastName[0]}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-gray-900 truncate">
                                                    {item.employeeFirstName} {item.employeeLastName}
                                                </span>
                                                <span className="text-xs text-gray-500 truncate italic">
                                                    {item.notes ? `"${item.notes}"` : 'No notes'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-700">{item.leaveTypeName}</span>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {formatDateRange(item.startDate, item.endDate)}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">
                                                {item.days} {item.days === 1 ? 'day' : 'days'}
                                            </span>
                                            {(item.startDayType === 'HALF' || item.endDayType === 'HALF') && (
                                                <span className="text-[10px] text-amber-600 font-medium uppercase tracking-tighter">
                                                    Partial Days
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Wallet className="w-3 h-3 text-zinc-400" />
                                            <span className="font-medium">
                                                {item.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {isHistory ? (
                                        <>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <StatusBadge status={item.approvalStatus} />
                                                    {item.approvalRemarks && (
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 max-w-[150px] truncate">
                                                            <MessageSquare className="w-2.5 h-2.5" />
                                                            {item.approvalRemarks}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    {item.approvalActedAt ? new Date(item.approvalActedAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                    )}

                                    <TableCell className="text-right">
                                        {!isHistory || item.approvalStatus === 'PENDING' ? (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs px-3 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300 transition-all"
                                                    onClick={() => handleAction(item, 'approve')}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs px-3 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300 transition-all"
                                                    onClick={() => handleAction(item, 'reject')}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end">
                                                <StatusBadge status={item.status} />
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {isHistory
                    ? renderPagination(historyTotal, historyPage, setHistoryPage)
                    : renderPagination(pendingTotal, pendingPage, setPendingPage)}
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Leave Approvals</h1>
                <p className="text-muted-foreground text-sm">
                    Manage and review leave requests for all employees reporting to you.
                </p>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList variant="line">
                        <TabsTrigger value="pending" className="gap-2">
                            <ClipboardCheck className="w-4 h-4" />
                            Pending
                            {pendingTotal > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                    {pendingTotal}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="w-4 h-4" />
                            History
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="pending" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Requests Awaiting Review</CardTitle>
                                <CardDescription>
                                    These requests require your approval or rejection.
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search employee..."
                                    className="pl-9 h-9"
                                    value={pendingSearch}
                                    onChange={(e) => {
                                        setPendingSearch(e.target.value)
                                        setPendingPage(1)
                                    }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderTable(pending)}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Request History</CardTitle>
                                <CardDescription>
                                    Past leave requests that you have already processed.
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search employee..."
                                    className="pl-9 h-9"
                                    value={historySearch}
                                    onChange={(e) => {
                                        setHistorySearch(e.target.value)
                                        setHistoryPage(1)
                                    }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderTable(history, true)}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ActOnRequestDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                request={selected}
                action={action}
                onSuccess={() => {
                    loadPending(pendingPage, pendingSearch)
                    loadHistory(historyPage, historySearch)
                }}
            />
        </div>
    )
}

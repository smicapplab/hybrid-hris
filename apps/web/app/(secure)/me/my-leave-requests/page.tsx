'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import {
    LeaveRequest,
    LeaveBalance,
    LeaveRequestStatus,
    formatDateRange,
} from '@/types/leave-requests.types'
import { Button } from '@/components/ui/button'
import {
    Plus,
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    Ban,
    ChevronDown,
} from 'lucide-react'
import RequestLeaveDialog from './components/request-leave-dialog'
import { useToast } from '@/hooks/use-toast'

// ── Status badge ────────────────────────────────────────────
const STATUS_CONFIG: Record<LeaveRequestStatus, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: {
        label: 'Pending',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock className="w-3 h-3" />,
    },
    APPROVED: {
        label: 'Approved',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    REJECTED: {
        label: 'Rejected',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: <XCircle className="w-3 h-3" />,
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'bg-gray-50 text-gray-500 border-gray-200',
        icon: <Ban className="w-3 h-3" />,
    },
}

function StatusBadge({ status }: { status: LeaveRequestStatus }) {
    const cfg = STATUS_CONFIG[status]
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    )
}

// ── Balance card ────────────────────────────────────────────
function BalanceCard({ balance }: { balance: LeaveBalance }) {
    const available = balance.balance
    const pending = balance.pendingDays

    return (
        <div className="rounded-xl border bg-white p-4 space-y-2 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 truncate pr-2">{balance.leaveTypeName}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${balance.isPaid ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {balance.isPaid ? 'Paid' : 'Unpaid'}
                </span>
            </div>
            <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-gray-900">{available.toFixed(1)}</span>
                <span className="text-sm text-gray-500 mb-1">days</span>
            </div>
            {pending > 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pending.toFixed(1)} days pending approval
                </p>
            )}
        </div>
    )
}

// ── Request row ─────────────────────────────────────────────
function RequestRow({
    request,
    onCancel,
}: {
    request: LeaveRequest
    onCancel: (id: string) => void
}) {
    const [expanded, setExpanded] = useState(false)
    const canCancel = request.status === 'PENDING' || request.status === 'APPROVED'

    return (
        <div className="rounded-lg border bg-white p-4 space-y-2 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{request.leaveTypeName}</p>
                        <StatusBadge status={request.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        {formatDateRange(request.startDate, request.endDate)}
                        <span className="text-gray-400">·</span>
                        <span>{request.days} {request.days === 1 ? 'day' : 'days'}</span>
                    </p>

                    {/* Half-day indicators */}
                    {(request.startDayType === 'HALF' || (request.startDate !== request.endDate && request.endDayType === 'HALF')) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                            {request.startDayType === 'HALF' && 'Starts afternoon'}
                            {request.startDate !== request.endDate && request.startDayType === 'HALF' && request.endDayType === 'HALF' && ', '}
                            {request.startDate !== request.endDate && request.endDayType === 'HALF' && 'Returns afternoon'}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {canCancel && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onCancel(request.id)}
                        >
                            Cancel
                        </Button>
                    )}
                    {(request.notes || request.approvalRemarks) && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="border-t pt-2 mt-1 space-y-1.5 text-xs text-gray-600">
                    {request.notes && (
                        <p><span className="font-medium">Notes:</span> {request.notes}</p>
                    )}
                    {request.approvalRemarks && (
                        <p>
                            <span className={`font-medium ${request.status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'}`}>
                                {request.status === 'REJECTED' ? 'Rejection reason:' : 'Approver remarks:'}
                            </span>{' '}
                            {request.approvalRemarks}
                        </p>
                    )}
                </div>
            )}

            <p className="text-[11px] text-gray-400">
                Submitted {new Date(request.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
        </div>
    )
}

// ── Main page ────────────────────────────────────────────────
export default function MyLeaveRequestsPage() {
    const { user } = useAuth()
    const { toast } = useToast()

    const [balances, setBalances] = useState<LeaveBalance[]>([])
    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [bal, reqs] = await Promise.all([
                apiFetch<LeaveBalance[]>('/leave-requests/my/balance'),
                apiFetch<LeaveRequest[]>('/leave-requests/my'),
            ])
            setBalances(bal)
            setRequests(reqs)
        } catch {
            // silently fail — will show empty state
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return
        try {
            await apiFetch(`/leave-requests/my/${id}/cancel`, { method: 'PATCH' })
            toast({ title: 'Leave request cancelled' })
            load()
        } catch (err: unknown) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to cancel',
                variant: 'destructive',
            })
        }
    }

    if (!user) return null

    const upcomingRequests = requests.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED')
    const historyRequests = requests.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED')

    return (
        <div className="p-6 max-w-4xl space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
                    <p className="text-sm text-gray-500 mt-1">Last 12 months</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Request Leave
                </Button>
            </div>

            {/* Balance cards */}
            <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Leave Balance</h2>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="rounded-xl border bg-gray-50 p-4 h-24 animate-pulse" />
                        ))}
                    </div>
                ) : balances.length === 0 ? (
                    <p className="text-sm text-gray-400">No leave types configured yet.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {balances.map((b) => (
                            <BalanceCard key={b.leaveTypeId} balance={b} />
                        ))}
                    </div>
                )}
            </section>

            {/* Upcoming / active requests */}
            <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Upcoming & Pending
                </h2>
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-20 rounded-lg border bg-gray-50 animate-pulse" />
                        ))}
                    </div>
                ) : upcomingRequests.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No upcoming or pending leave requests.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {upcomingRequests.map((r) => (
                            <RequestRow key={r.id} request={r} onCancel={handleCancel} />
                        ))}
                    </div>
                )}
            </section>

            {/* History */}
            {historyRequests.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
                    <div className="space-y-2">
                        {historyRequests.map((r) => (
                            <RequestRow key={r.id} request={r} onCancel={handleCancel} />
                        ))}
                    </div>
                </section>
            )}

            {/* Request dialog */}
            <RequestLeaveDialog
                open={dialogOpen}
                onOpenChangeAction={setDialogOpen}
                balances={balances}
                onSuccessAction={load}
            />
        </div>
    )
}

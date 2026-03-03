'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { PendingApprovalItem, formatDateRange } from '@/types/leave-requests.types'
import ActOnRequestDialog from '../../me/my-leave-requests/components/act-on-request-dialog'
import { ClipboardCheck, User, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PendingApprovalsWidget() {
    const [items, setItems] = useState<PendingApprovalItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<PendingApprovalItem | null>(null)
    const [action, setAction] = useState<'approve' | 'reject'>('approve')
    const [dialogOpen, setDialogOpen] = useState(false)

    const load = useCallback(() => {
        apiFetch<PendingApprovalItem[]>('/leave-requests/pending-approval')
            .then(setItems)
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    const openAction = (item: PendingApprovalItem, act: 'approve' | 'reject') => {
        setSelected(item)
        setAction(act)
        setDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                    {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-gray-800">Pending Approvals</h3>
                        {items.length > 0 && (
                            <span className="ml-1 text-xs bg-amber-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center font-bold">
                                {items.length}
                            </span>
                        )}
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-400">No pending approvals.</p>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {items.map((item) => (
                            <li key={item.id} className="px-4 py-3 hover:bg-gray-50">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            {item.employeeFirstName} {item.employeeLastName}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                            <CalendarDays className="w-3 h-3 flex-shrink-0" />
                                            {item.leaveTypeName} · {formatDateRange(item.startDate, item.endDate)}
                                            <span className="text-gray-400 mx-0.5">·</span>
                                            {item.days} {item.days === 1 ? 'day' : 'days'}
                                        </p>
                                        {item.notes && (
                                            <p className="text-xs text-gray-400 italic mt-0.5 truncate max-w-xs">
                                                "{item.notes}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs px-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                            onClick={() => openAction(item, 'approve')}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => openAction(item, 'reject')}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ActOnRequestDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                request={selected}
                action={action}
                onSuccess={load}
            />
        </>
    )
}

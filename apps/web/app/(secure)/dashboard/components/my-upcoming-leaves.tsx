'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { MyUpcomingLeave, formatDateRange, LeaveRequestStatus } from '@/types/leave-requests.types'
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

function statusChip(status: LeaveRequestStatus) {
    if (status === 'APPROVED') return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-2.5 h-2.5" /> Approved
        </span>
    )
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5" /> Pending
        </span>
    )
}

export default function MyUpcomingLeaves() {
    const [leaves, setLeaves] = useState<MyUpcomingLeave[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiFetch<MyUpcomingLeave[]>('/leave-requests/my/upcoming')
            .then(setLeaves)
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                    {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-linear-to-r from-blue-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">My Upcoming Leaves</h3>
                </div>
                <Link href="/me/my-leave-requests" className="text-xs text-blue-600 hover:underline">
                    View all
                </Link>
            </div>

            {leaves.length === 0 ? (
                <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">No upcoming leaves.</p>
                </div>
            ) : (
                <ul className="divide-y divide-orange-50 max-h-100 overflow-y-auto">
                    {leaves.map((l) => (
                        <li key={l.id} className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{l.leaveTypeName}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <CalendarDays className="w-3 h-3" />
                                    {formatDateRange(l.startDate, l.endDate)}
                                    <span className="text-gray-400 mx-0.5">·</span>
                                    {l.days} {l.days === 1 ? 'day' : 'days'}
                                </p>
                            </div>
                            {statusChip(l.status)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

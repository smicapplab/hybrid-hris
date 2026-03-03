'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { TeamLeaveItem, formatDateRange } from '@/types/leave-requests.types'
import { Users, CalendarDays } from 'lucide-react'

export default function UpcomingTeamLeaves() {
    const [leaves, setLeaves] = useState<TeamLeaveItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiFetch<TeamLeaveItem[]>('/leave-requests/upcoming-team')
            .then(setLeaves)
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-800">Upcoming Team Leaves</h3>
            </div>

            {leaves.length === 0 ? (
                <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">No upcoming approved team leaves.</p>
                </div>
            ) : (
                <ul className="divide-y">
                    {leaves.map((l) => (
                        <li key={l.id} className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800">
                                    {l.employeeFirstName} {l.employeeLastName}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <CalendarDays className="w-3 h-3 flex-shrink-0" />
                                    {l.leaveTypeName} · {formatDateRange(l.startDate, l.endDate)}
                                    <span className="text-gray-400 mx-0.5">·</span>
                                    {l.days} {l.days === 1 ? 'day' : 'days'}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

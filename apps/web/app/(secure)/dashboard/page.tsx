'use client'

import { useAuth } from '@/context/AuthContext'
import MyUpcomingLeaves from './components/my-upcoming-leaves'
import PendingApprovalsWidget from './components/pending-approvals-widget'
import UpcomingTeamLeaves from './components/upcoming-team-leaves'
import AttendanceWidget from './components/attendance-widget'

export default function DashboardPage() {
    const { user } = useAuth()

    if (!user) return null // layout handles redirect

    const isApprover = user.roles.some((r) =>
        ['HR_ADMIN', 'ADMIN', 'MANAGER'].includes(r),
    )

    return (
        <div className="p-6 max-w-5xl space-y-8">
            {/* Top Section: Greeting & Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 py-4">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Welcome back, {user.firstName}
                    </h1>
                    <p className="text-gray-500 mt-1">{user.email}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {user.roles.map(role => (
                            <span key={role} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                                {role.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="w-full">
                    <AttendanceWidget />
                </div>
            </div>

            {/* Approver section — only shown when user has approver role */}
            {isApprover && (
                <section>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Action Required
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <PendingApprovalsWidget />
                        <UpcomingTeamLeaves />
                    </div>
                </section>
            )}

            {/* Employee section — all linked employees */}
            {user.employeeId && (
                <section>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        My Leaves
                    </h2>
                    <div className="max-w-sm">
                        <MyUpcomingLeaves />
                    </div>
                </section>
            )}
        </div>
    )
}

'use client'

import { useAuth } from '@/context/AuthContext'
import MyUpcomingLeaves from './components/my-upcoming-leaves'
import PendingApprovalsWidget from './components/pending-approvals-widget'
import UpcomingTeamLeaves from './components/upcoming-team-leaves'

export default function DashboardPage() {
    const { user } = useAuth()

    if (!user) return null // layout handles redirect

    const isApprover = user.roles.some((r) =>
        ['HR_ADMIN', 'ADMIN', 'MANAGER'].includes(r),
    )

    return (
        <div className="p-6 max-w-5xl space-y-8">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.firstName}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
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

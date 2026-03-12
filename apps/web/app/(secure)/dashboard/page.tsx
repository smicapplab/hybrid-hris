'use client'

import { useAuth } from '@/context/AuthContext'
import MyUpcomingLeaves from './components/my-upcoming-leaves'
import PendingApprovalsWidget from './components/pending-approvals-widget'
import PendingAttendanceApprovalsWidget from './components/pending-attendance-approvals-widget'
import UpcomingTeamLeaves from './components/upcoming-team-leaves'
import AttendanceWidget from './components/attendance-widget'
import UpcomingTrainings from './components/upcoming-trainings'

export default function DashboardPage() {
    const { user } = useAuth()

    if (!user) return null // layout handles redirect

    const isApprover = user.roles.some((r) =>
        ['HR_ADMIN', 'ADMIN', 'MANAGER'].includes(r),
    )

    return (
        <div className="p-6 space-y-8">
            {/* Top Section: Greeting & Attendance */}
            <div className='space-y-3'>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Welcome back, {user.firstName}
                    </h1>
                    <p className="text-gray-500 mt-1">{user.email}</p>
                </div>
                <AttendanceWidget />
            </div>
            {user.employeeId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        {isApprover && (
                            <>
                                <PendingApprovalsWidget />
                                <PendingAttendanceApprovalsWidget />
                            </>
                        )}
                        <MyUpcomingLeaves />
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {isApprover && <UpcomingTeamLeaves />}
                        <UpcomingTrainings />
                    </div>

                </div>
            )}
        </div>
    )
}

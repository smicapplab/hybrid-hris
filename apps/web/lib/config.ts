import { NavCategory } from "@/types/nav.type"
import {
    LayoutDashboard,
    Users,
    Building2,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    Shield,
    Sailboat,
    User,
    Clock,
    ClipboardList,
    Settings,
} from "lucide-react";

export const navigation: NavCategory[] = [
    {
        elements: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: LayoutDashboard,
            }
        ]
    },
    {
        title: "My Profile",
        elements: [
            {
                title: "Personal Information",
                url: "/me/my-profile",
                icon: User,
            },
            {
                title: "My Organization",
                url: "/me/organization",
                icon: Building2,
            },
            {
                title: "Account Security",
                url: "/me/security",
                icon: Shield,
            },
            {
                title: "Work Schedule",
                url: "/me/work-schedule",
                icon: Clock,
            },
            {
                title: "Attendance History",
                url: "/me/attendance-history",
                icon: ClipboardList,
            },
            {
                title: "My Leave Requests",
                url: "/me/my-leave-requests",
                icon: CalendarDays,
            },
        ]
    },
    {
        title: "People",
        elements: [
            {
                title: "Employees",
                url: "/people/employees",
                icon: Users,
            },
            {
                title: "Organization Structure",
                url: "/people/org-structure",
                icon: Building2,
            },
            {
                title: "Positions",
                url: "/people/positions",
                icon: Briefcase,
            },
        ]
    },
    {
        title: "Leave",
        elements: [
            {
                title: "My Leave Requests",
                url: "/leave/my-requests",
                icon: CalendarDays,
            },
            {
                title: "Leave Approvals",
                url: "/leave/approvals",
                icon: CheckCircle2,
            },
        ]
    },
    {
        title: "Administration",
        roles: ['HR_ADMIN', 'ADMIN'],
        elements: [
            {
                title: "Leave Policies",
                url: "/admin/leave-management",
                icon: Sailboat,
            },
            {
                title: "Leave Types",
                url: "/admin/leave-types",
                icon: Settings,
            },
        ]
    },
];
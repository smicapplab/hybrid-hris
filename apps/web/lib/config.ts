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
    Receipt,
    Calculator,
    ClipboardCheck,
    ReceiptText,
    UserPlus,
    GraduationCap,
    Library,
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
                title: "My Trainings",
                url: "/me/my-trainings",
                icon: GraduationCap,
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
            {
                title: "Plantilla & Recruitment",
                url: "/people/plantilla",
                icon: UserPlus,
            },
        ],
        roles: ['ADMIN', 'HR_ADMIN'],
    },
    {
        title: "Leave",
        elements: [
            {
                title: "My Leave Requests",
                url: "/me/my-leave-requests",
                icon: CalendarDays,
            },
            {
                title: "Leave Approvals",
                url: "/leave/approvals",
                icon: CheckCircle2,
                roles: ['ADMIN', 'HR_ADMIN', 'SUPERVISOR', 'MANAGER'],
            },
        ]
    },
    {
        title: "Attendance",
        elements: [
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
                title: "Attendance Approvals",
                url: "/attendance/approvals",
                icon: ClipboardCheck,
                roles: ['ADMIN', 'HR_ADMIN', 'SUPERVISOR', 'MANAGER'],
            },
        ]
    },
    {
        title: "Expenses",
        elements: [
            {
                title: "My Expenses",
                url: "/me/expenses",
                icon: Receipt,
            },
            {
                title: "Expense Approvals",
                url: "/expenses/approvals",
                icon: ReceiptText,
                roles: ['ADMIN', 'HR_ADMIN', 'SUPERVISOR', 'MANAGER'],
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
            {
                title: "Skills Taxonomy",
                url: "/admin/skills",
                icon: GraduationCap,
            },
            {
                title: "Training Catalog",
                url: "/admin/training",
                icon: Library,
            },
            {
                title: "Team Budgets",
                url: "/admin/budgets",
                icon: Calculator,
            },
            {
                title: "Organization Settings",
                url: "/admin/settings",
                icon: Settings,
                roles: ['ADMIN'],
            },
        ]
    },
];
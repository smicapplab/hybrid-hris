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
    Timer,
    Settings,
    Receipt,
    Calculator,
    ClipboardCheck,
    ReceiptText,
    UserPlus,
    GraduationCap,
    Library,
    Umbrella,
    ArrowRight,
    UserCheck,
    Wallet,
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
                title: "My Payslips",
                url: "/me/payslips",
                icon: Wallet,
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
                title: "My Overtime Requests",
                url: "/me/overtime-requests",
                icon: Timer,
            },
            {
                title: "Attendance Approvals",
                url: "/attendance/approvals",
                icon: ClipboardCheck,
                roles: ['ADMIN', 'HR_ADMIN', 'SUPERVISOR', 'MANAGER'],
            },
            {
                title: "Overtime Approvals",
                url: "/attendance/overtime-approvals",
                icon: Timer,
                roles: ['ADMIN', 'HR_ADMIN', 'SUPERVISOR', 'MANAGER'],
            },
            {
                title: "Real-time Presence",
                url: "/attendance/presence",
                icon: UserCheck,
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
                title: "Policy & Compliance",
                icon: Shield,
                items: [
                    {
                        title: "Leave Policies",
                        url: "/admin/leave-management",
                    },
                    {
                        title: "Leave Types",
                        url: "/admin/leave-types",
                    },
                    {
                        title: "Holiday Maintenance",
                        url: "/admin/holidays",
                    },
                ]
            },
            {
                title: "HR Configuration",
                icon: Settings,
                items: [
                    {
                        title: "Job Levels",
                        url: "/admin/job-levels",
                    },
                    {
                        title: "Shift Templates",
                        url: "/admin/shift-templates",
                    },
                    {
                        title: "Organization Settings",
                        url: "/admin/settings",
                    },
                ]
            },
            {
                title: "Payroll Management",
                icon: Calculator,
                roles: ['HR_ADMIN'],
                items: [
                    {
                        title: "Payroll Components",
                        url: "/admin/payroll-components",
                    },
                    {
                        title: "Compensation Templates",
                        url: "/admin/compensation-templates",
                    },
                    {
                        title: "Payroll Batches",
                        url: "/admin/payroll-batches",
                    },
                    {
                        title: "13th Month Management",
                        url: "/admin/payroll/thirteenth-month",
                    },
                ]
            },
            {
                title: "Learning & Development",
                icon: GraduationCap,
                items: [
                    {
                        title: "Skills Taxonomy",
                        url: "/admin/skills",
                    },
                    {
                        title: "Training Catalog",
                        url: "/admin/training",
                    },
                ]
            },
            {
                title: "Operational Controls",
                icon: CheckCircle2,
                items: [
                    {
                        title: "Pending Changes",
                        url: "/admin/pending-changes",
                    },
                    {
                        title: "Team Budgets",
                        url: "/admin/budgets",
                    },
                ]
            },
        ]
    },
];

import { NavCategory } from "@/types/nav.type"
import {
    LayoutDashboard,
    Users,
    Building2,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    Shield,
    UserCog,
    Sailboat,
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
        title: "People",
        elements: [
            {
                title: "Employees",
                url: "/people/employees",
                icon: Users,
            },
            {
                title: "Org Structure",
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
            // {
            //     title: "Policies",
            //     url: "/leave/policies",
            //     icon: LayoutDashboard,
            //     isActive: true,
            // },
        ]
    },
    {
        title: "Administration",
        elements: [
            {
                title: "Leave Management",
                url: "/admin/leave-managment",
                icon: Sailboat,
            },
        ]
    },
];
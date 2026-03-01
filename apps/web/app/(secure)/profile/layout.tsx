import { Separator } from "@/components/ui/separator"
import { Metadata } from "next"
import { SidebarNav } from "./components/sidebar-nav"

export interface SettingsLayoutProps {
    children: React.ReactNode
}

export const metadata: Metadata = {
    title: "Forms",
    description: "Advanced form example using react-hook-form and Zod.",
}

const sidebarNavItems = [
    {
        title: "Personal Info",
        href: "/profile/my-profile",
    },
    {
        title: "Organization",
        href: "/profile/organization",
    },
    {
        title: "Security",
        href: "/profile/security",
    },
    {
        title: "My Work Schedule",
        href: "/profile/work-schedule",
    },
    {
        title: "My Attendance Record",
        href: "/profile/attendance-history",
    },
]

export default function ProfileLayout({ children }: SettingsLayoutProps) {
    return (
        <>
            <div className="space-y-6 p-3 lg:p-10 pb-16 md:block">
                <div className="space-y-0.5">
                    <p className="text-muted-foreground">
                        Easily manage your account settings, view and update your schedule, and personalize your preferences to tailor your experience.
                    </p>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="-mx-4 lg:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex-1 lg:w-4/5 px-0 lg:px-10">{children}</div>
                </div>
            </div>
        </>
    )
}
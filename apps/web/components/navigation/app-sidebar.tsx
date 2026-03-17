"use client"

import * as React from "react"
import { 
    Sidebar, 
    SidebarContent, 
    SidebarFooter, 
    SidebarHeader, 
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail, 
    useSidebar 
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import Image from "next/image"
import { Separator } from "../ui/separator"
import { navigation } from "@/lib/config"
import { NavUser } from "./nav-user"
import { useAuth } from "@/context/AuthContext"
import { NavCategory } from "@/types/nav.type"
import { BookOpen } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar> & {}) {

    const { state } = useSidebar();
    const { user } = useAuth();

    const visibleNav = navigation.reduce<NavCategory[]>((acc, category) => {
        // Filter the category itself based on roles
        const categoryRoles = category.roles || [];
        const hasCategoryAccess = categoryRoles.length === 0 || 
            categoryRoles.some((role) => user?.roles.includes(role));

        if (!hasCategoryAccess) return acc;

        // Filter individual elements inside the category
        const visibleElements = category.elements.filter((item) => {
            const itemRoles = item.roles || [];
            if (itemRoles.length === 0) return true;
            if (!user) return false;

            const hasRole = itemRoles.some((role: string) => user.roles.includes(role));
            const isSupervisorMatch = itemRoles.includes('SUPERVISOR') && user.isSupervisor;

            return hasRole || isSupervisorMatch;
        });

        if (visibleElements.length > 0) {
            acc.push({ ...category, elements: visibleElements });
        }

        return acc;
    }, []);

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader
                className={`bg-white transition-all duration-300 py-5 ${state === "collapsed" ? "hidden" : "block"
                    }`}
            >
                <div className="flex items-center gap-2 font-bold text-xl text-blue-900">
                    <Image
                        src="/icon.png"
                        alt="Logo"
                        width={30}
                        height={75}
                        priority
                    /> HRIS
                </div>
            </SidebarHeader>
            <Separator />
            <SidebarContent className="bg-white">
                {visibleNav.map((nav, i) => (
                    <NavMain key={i} navItem={nav} />
                ))}
            </SidebarContent>
            <SidebarFooter className="bg-white">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="User Manual">
                            <a href="/manual" target="_blank" rel="noopener noreferrer">
                                <BookOpen className="size-4" />
                                <span>User Manual</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

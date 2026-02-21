"use client"

import * as React from "react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import Image from "next/image"
import { Separator } from "../ui/separator"
import { navigation } from "@/lib/config"
import { NavUser } from "./nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar> & {}) {

    const { state } = useSidebar();

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
                {navigation.map((nav, i) => (
                    <NavMain key={i} navItem={nav} />
                ))}
            </SidebarContent>
            <SidebarFooter className="bg-blue-50">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

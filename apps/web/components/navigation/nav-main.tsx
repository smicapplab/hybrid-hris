"use client"

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { NavCategory } from "@/types/nav.type"

export function NavMain({ navItem }: { navItem: NavCategory }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <SidebarGroup>
            {navItem.title && <SidebarGroupLabel>{navItem.title}</SidebarGroupLabel>}
            <SidebarMenu>
                {navItem.elements && navItem.elements.map(nav => {
                    const isActive = nav.url !== "/" ? pathname.startsWith(nav.url) : pathname === "/";

                    return (<SidebarMenuButton key={nav.title}
                        isActive={isActive}
                        tooltip={nav.title}
                        className={`transition-colors
                                         ${isActive
                                ? "data-[active=true]:bg-primary! data-[active=true]:text-white! font-semibold"
                                : "hover:bg-primary/10 hover:text-primary"
                            }`}
                        onClick={() => {
                            router.push(nav.url);
                        }}
                    >
                        {nav.icon && <nav.icon />}
                        <span>{nav.title}</span>
                    </SidebarMenuButton>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

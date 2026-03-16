"use client"

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { NavCategory } from "@/types/nav.type"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"

export function NavMain({ navItem }: { navItem: NavCategory }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <SidebarGroup>
            {navItem.title && <SidebarGroupLabel>{navItem.title}</SidebarGroupLabel>}
            <SidebarMenu>
                {navItem.elements && navItem.elements.map(nav => {
                    const hasItems = nav.items && nav.items.length > 0;
                    const isParentActive = !!(nav.url && pathname.startsWith(nav.url));
                    const isChildActive = !!(nav.items?.some(item => pathname.startsWith(item.url)));
                    const isActive = isParentActive || isChildActive;

                    if (hasItems) {
                        return (
                            <Collapsible
                                key={nav.title}
                                asChild
                                defaultOpen={isActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={nav.title}>
                                            {nav.icon && <nav.icon />}
                                            <span>{nav.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {nav.items?.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={pathname.startsWith(subItem.url)}
                                                    >
                                                        <button onClick={() => router.push(subItem.url)}>
                                                            {subItem.title}
                                                        </button>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    const isLinkActive = nav.url !== "/" ? pathname.startsWith(nav.url!) : pathname === "/";

                    return (
                        <SidebarMenuItem key={nav.title}>
                            <SidebarMenuButton
                                isActive={isLinkActive}
                                tooltip={nav.title}
                                className={`transition-colors
                                             ${isLinkActive
                                        ? "data-[active=true]:bg-primary! data-[active=true]:text-white! font-semibold"
                                        : "hover:bg-primary/10 hover:text-primary"
                                    }`}
                                onClick={() => {
                                    if (nav.url) router.push(nav.url);
                                }}
                            >
                                {nav.icon && <nav.icon />}
                                <span>{nav.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

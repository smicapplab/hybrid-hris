"use client";

import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/config";

export default function LayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {

    const pathname = usePathname();

    function deriveTitle(): string {
        if (!pathname) return "";

        for (const category of navigation) {
            for (const item of category.elements) {
                // Check top-level elements
                if (item.url) {
                    if (pathname === item.url || pathname.startsWith(item.url + "/")) {
                        return item.title;
                    }

                    // Handle base section
                    const baseSection = item.url.split("/")[1];
                    if (pathname === `/${baseSection}`) {
                        return item.title;
                    }
                }

                // Check sub-items
                if (item.items) {
                    for (const subItem of item.items) {
                        if (pathname === subItem.url || pathname.startsWith(subItem.url + "/")) {
                            return subItem.title;
                        }
                    }
                }
            }
        }

        return "";
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <h1 className="text-md font-semibold tracking-tight">
                            {deriveTitle()}
                        </h1>
                    </div>
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
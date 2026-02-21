import type { LucideIcon } from "lucide-react";

export type NavCategory = {
    title?: string;
    elements: Element[];
}

export type Element = {
    title: string;
    url: string;
    icon?: LucideIcon,
    isActive?: boolean;
    items?: Item[];
}

export type Item = {
    title: string;
    url?: string;
}
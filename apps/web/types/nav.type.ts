import type { LucideIcon } from "lucide-react";

export type NavCategory = {
    title?: string;
    elements: Element[];
    /** If set, category is only visible to users with at least one matching role */
    roles?: string[];
}

export type Element = {
    title: string;
    url?: string;
    icon?: LucideIcon,
    isActive?: boolean;
    items?: Item[];
    roles?: string[];
}

export type Item = {
    title: string;
    url: string;
}
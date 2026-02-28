import { createElement } from "react"

export function stripSystemFields<T extends object>(
    obj: T | null | undefined,
): Omit<T, 'employeeId' | 'createdAt' | 'updatedAt'> | null {
    if (!obj) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { employeeId: _eid, createdAt: _ca, updatedAt: _ua, ...rest } = obj as T & {
        employeeId?: unknown
        createdAt?: unknown
        updatedAt?: unknown
    }
    return rest
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
    return createElement(
        'h3',
        {
            className:
                'text-sm font-semibold text-muted-foreground uppercase tracking-wide',
        },
        children,
    )
}
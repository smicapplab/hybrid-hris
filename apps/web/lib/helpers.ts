// Date Helpers
export function toISODateString(date: Date): string {
    return date.toISOString().split('T')[0]
}

export function safeParseDate(value?: string | null): Date | undefined {
    if (!value) return undefined
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? undefined : parsed
}


// String Helpers
export function normalizeEmail(email?: string | null): string | undefined {
    if (!email) return undefined
    const trimmed = email.trim().toLowerCase()
    return trimmed.length ? trimmed : undefined
}

export function emptyToNull(value?: string | null): string | null {
    if (!value) return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
}


// Object Helpers
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as Partial<T>
}


// Form Helpers
export function ensureNestedObject<T extends object>(
    parent: T | undefined,
): T {
    return (parent ?? {}) as T
}

// Number Helpers
export function formatNumber(val: number | string | null | undefined, precision = 0): string {
    if (val === null || val === undefined || val === '') return '-'
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return '-'

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    }).format(num)
}

export function formatAmount(val: number | string | null | undefined): string {
    return formatNumber(val, 2)
}
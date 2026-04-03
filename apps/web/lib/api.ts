const API_URL = process.env.NEXT_PUBLIC_API_URL as string
const TOKEN_STORAGE_KEY = 'hris_access_token'

// Decode JWT expiry from the payload (no signature verification — server validates on use)
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number }
        return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
    } catch {
        return true
    }
}

// Hydrate from localStorage on module load so the access token survives page reloads.
// Falls back to null on SSR (no window) or if the stored token is already expired.
let accessToken: string | null = (() => {
    if (typeof window === 'undefined') return null
    try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (stored && !isTokenExpired(stored)) return stored
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        return null
    } catch {
        return null
    }
})()

let refreshing: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
    accessToken = token
    if (typeof window === 'undefined') return
    try {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token)
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY)
        }
    } catch {
        // Ignore storage errors (private browsing quota limits, etc.)
    }
}

export function getAccessToken() {
    return accessToken
}

export { isTokenExpired }

export async function refreshAccessToken(): Promise<string | null> {
    if (!refreshing) {
        refreshing = (async () => {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            })

            if (!res.ok) {
                setAccessToken(null)
                return null
            }

            const data = (await res.json()) as { accessToken: string }
            setAccessToken(data.accessToken)
            return data.accessToken
        })().finally(() => {
            refreshing = null
        })
    }

    return refreshing
}

// Reads the response body once as text, then tries to extract a message from JSON.
// Avoids double-read bugs from calling .json() then .clone().text().
async function parseError(res: Response): Promise<string> {
    let body = ''
    try {
        body = await res.text()
    } catch {
        return `Request failed: ${res.status}`
    }

    if (body) {
        try {
            const json = JSON.parse(body) as { message?: string }
            if (json?.message) return json.message
        } catch { }
    }

    return `Request failed: ${res.status}`
}

function buildHeaders(base?: HeadersInit, token?: string | null, hasBody?: boolean): Headers {
    const headers = new Headers(base)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    return headers
}

export async function apiFetch<T>(
    path: string,
    init: RequestInit & { retry?: boolean; params?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
    let url = `${API_URL}${path}`

    if (init.params) {
        const query = new URLSearchParams()
        Object.entries(init.params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, String(value))
            }
        })
        const queryString = query.toString()
        if (queryString) {
            url += `${url.includes('?') ? '&' : '?'}${queryString}`
        }
    }

    const headers = buildHeaders(init.headers, accessToken, !!init.body)

    const res = await fetch(url, {
        ...init,
        headers,
        credentials: 'include',
    })

    // Unauthorized — attempt token refresh once then retry
    if (res.status === 401 && init.retry !== false) {
        const newToken = await refreshAccessToken()
        if (!newToken) throw new Error('Unauthorized')

        const retryHeaders = buildHeaders(init.headers, newToken, !!init.body)

        const retryRes = await fetch(`${API_URL}${path}`, {
            ...init,
            headers: retryHeaders,
            credentials: 'include',
        })

        if (!retryRes.ok) throw new Error(await parseError(retryRes))
        if (retryRes.status === 204) return undefined as T
        return retryRes.json() as Promise<T>
    }

    if (!res.ok) throw new Error(await parseError(res))
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
}

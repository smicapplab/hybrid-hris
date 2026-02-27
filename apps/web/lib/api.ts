const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
    if (!refreshing) {
        refreshing = (async () => {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!res.ok) {
                setAccessToken(null);
                return null;
            }

            const data = (await res.json()) as { accessToken: string };
            setAccessToken(data.accessToken);
            return data.accessToken;
        })().finally(() => {
            refreshing = null;
        });
    }

    return refreshing;
}

export async function apiFetch<T>(
    path: string,
    init: RequestInit & { retry?: boolean } = {},
): Promise<T> {
    const headers = new Headers(init.headers);

    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        credentials: 'include',
    });

    // If unauthorized, attempt refresh once
    if (res.status === 401 && init.retry !== false) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
            throw new Error('Unauthorized');
        }

        const retryHeaders = new Headers(init.headers);
        retryHeaders.set('Authorization', `Bearer ${newToken}`);

        if (init.body && !retryHeaders.has('Content-Type')) {
            retryHeaders.set('Content-Type', 'application/json');
        }

        const retryRes = await fetch(`${API_URL}${path}`, {
            ...init,
            headers: retryHeaders,
            credentials: 'include',
        });

        if (!retryRes.ok) {
            let message = `Request failed: ${retryRes.status}`;
            try {
                const errorData = await retryRes.json();
                if (errorData?.message) {
                    message = errorData.message;
                }
            } catch { }

            try {
                const raw = await retryRes.clone().text();
                console.error('API retry error:', retryRes.status, raw);
            } catch {}

            throw new Error(message);
        }

        if (retryRes.status === 204) {
            return undefined as T;
        }

        return retryRes.json() as Promise<T>;
    }

    if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        try {
            const errorData = await res.json();
            if (errorData?.message) {
                message = errorData.message;
            }
        } catch { }

        try {
            const raw = await res.clone().text();
            console.error('API error:', res.status, raw);
        } catch {}

        throw new Error(message);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
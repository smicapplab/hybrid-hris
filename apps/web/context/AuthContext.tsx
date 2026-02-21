'use client';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useEffect,
} from 'react';

import { apiFetch, setAccessToken } from '@/lib/api';
import type { JwtUser, LoginResponse } from '@/lib/auth-types';

type AuthContextType = {
    user: JwtUser | null;
    isLoading: boolean;
    isHydrated: boolean;
    login(email: string, password: string): Promise<void>;
    logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<JwtUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        async function bootstrap() {
            try {
                const me = await apiFetch<JwtUser>('/auth/me');
                setUser(me);
            } catch {
                setUser(null);
            } finally {
                setIsHydrated(true);
            }
        }

        bootstrap();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const data = await apiFetch<LoginResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            setAccessToken(data.accessToken);

            const me = await apiFetch<JwtUser>('/auth/me');
            setUser(me);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiFetch('/auth/logout', { method: 'POST' });
        } catch {
            // ignore network errors during logout
        } finally {
            setAccessToken(null);
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({ user, isLoading, isHydrated, login, logout }),
        [user, isLoading, isHydrated, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return ctx;
}
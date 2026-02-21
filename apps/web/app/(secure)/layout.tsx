'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LayoutClient from './layout-client';

export default function SecureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isHydrated } = useAuth();

    useEffect(() => {
        if (isHydrated && !user) {
            router.replace('/login');
        }
    }, [isHydrated, user, router]);

    if (!isHydrated) {
        return null; // or loading spinner
    }

    if (!user) {
        return null;
    }

    return <LayoutClient>{children}</LayoutClient>;
}
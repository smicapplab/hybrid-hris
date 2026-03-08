'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            setAccessToken(token);
            // Small delay to ensure state is settled if needed
            router.replace('/dashboard');
        } else {
            // No token found, redirect to login
            router.replace('/login?error=oauth_failed');
        }
    }, [router, searchParams]);

    return (
        <div className="flex min-h-svh items-center justify-center flex-col gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-muted-foreground animate-pulse font-medium"> Finalizing your secure sign-in... </p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-svh items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}

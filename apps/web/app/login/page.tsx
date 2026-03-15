'use client';

import { useState, useEffect, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from './components/login-form';
import { PunchForm } from './components/punch-form';
import { apiFetch } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export type AuthConfig = {
    passwordLoginEnabled: boolean;
    googleLoginEnabled: boolean;
    microsoftLoginEnabled: boolean;
    googleClientId: string | null;
    isDemo: boolean;
};

export default function LoginPage() {
    const [config, setConfig] = useState<AuthConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadConfig() {
            try {
                const data = await apiFetch<AuthConfig>('/auth/config');
                setConfig(data);
            } catch (err) {
                console.error('Failed to load auth config:', err);
                // Fallback to default
                setConfig({
                    passwordLoginEnabled: true,
                    googleLoginEnabled: false,
                    microsoftLoginEnabled: false,
                    googleClientId: null,
                    isDemo: false,
                });
            } finally {
                setLoading(false);
            }
        }
        loadConfig();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <Tabs defaultValue="login">
                    <TabsList className="w-full border">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="timeIn">Time In/Out</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Suspense fallback={
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        }>
                            <LoginForm config={config} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="timeIn">
                        <PunchForm />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from './components/login-form';
import { PunchForm } from './components/punch-form';

export default function LoginPage() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <Tabs defaultValue="login">
                    <TabsList className="w-full">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="timeIn">Time In/Out</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <LoginForm />
                    </TabsContent>

                    <TabsContent value="timeIn">
                        <PunchForm />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
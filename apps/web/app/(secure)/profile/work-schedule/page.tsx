'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';

export default function WorkSchedulePage() {
    const { user } = useAuth();

    if (!user) return null; // layout handles redirect

    return (
        <Card>
            <CardContent className="space-y-8">
                <h2 className='text-xl font-bold'>Work Schedule</h2>
                <Separator />
            </CardContent>
        </Card>
    );
}
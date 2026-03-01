'use client';

import { useAuth } from '@/context/AuthContext';

export default function LeaveTypesPage() {
    const { user } = useAuth();

    if (!user) return null; // layout handles redirect

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">
                Welcome {user.firstName} {user.lastName}
            </h1>
            <p className="mt-2 text-gray-600">{user.email}</p>
        </div>
    );
}
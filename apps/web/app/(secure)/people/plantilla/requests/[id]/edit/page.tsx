'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { ManpowerRequestForm } from '../../../components/manpower-request-form';
import { ManpowerRequest } from '@hybrid-hris/db/types';

function EditRequestPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const returnTo = searchParams.get('returnTo') || undefined;
    
    const [request, setRequest] = useState<ManpowerRequest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            apiFetch<ManpowerRequest>(`/manpower/requests/${id}`)
                .then(data => {
                    setRequest(data);
                    setLoading(false);
                })
                .catch(console.error);
        }
    }, [id]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!request) return <div className="p-8 text-center text-muted-foreground">Request not found.</div>;

    return <ManpowerRequestForm initialData={request} returnTo={returnTo} />;
}

export default function EditManpowerRequestPage() {
    return (
        <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
            <EditRequestPageContent />
        </Suspense>
    );
}

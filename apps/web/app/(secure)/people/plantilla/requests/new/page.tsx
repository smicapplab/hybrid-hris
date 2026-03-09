'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ManpowerRequestForm } from '../../components/manpower-request-form';

function NewRequestPageContent() {
    const searchParams = useSearchParams();
    const preOrgUnitId = searchParams.get('orgUnitId');
    const prePositionId = searchParams.get('positionId');
    const returnTo = searchParams.get('returnTo') || undefined;

    return (
        <ManpowerRequestForm 
            preOrgUnitId={preOrgUnitId} 
            prePositionId={prePositionId} 
            returnTo={returnTo}
        />
    );
}

export default function NewManpowerRequestPage() {
    return (
        <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
            <NewRequestPageContent />
        </Suspense>
    );
}

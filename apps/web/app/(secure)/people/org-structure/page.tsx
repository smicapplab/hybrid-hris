'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { OrgTree } from './components/org-tree';
import type { OrgUnit } from '@hybrid-hris/db/types';

interface OrgUnitNode extends OrgUnit {
    children: OrgUnitNode[];
}

export default function OrgStructurePage() {
    const { user } = useAuth();
    const [data, setData] = useState<OrgUnitNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const result = await apiFetch<OrgUnitNode[]>('/org-units/tree');
                setData(result);
            } finally {
                setLoading(false);
            }
        }

        if (user) load();
    }, [user]);

    if (!user) return null; // layout handles redirect

    if (loading) {
        return <div className="p-8">Loading organization...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Organization Structure</h1>

            {data.length === 0 ? (
                <div className="text-muted-foreground">No organization units found.</div>
            ) : (
                <OrgTree data={data} />
            )}
        </div>
    );
}
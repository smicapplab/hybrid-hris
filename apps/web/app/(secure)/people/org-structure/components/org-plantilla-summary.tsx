'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, Clock, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '@/lib/helpers';

interface OrgPlantillaSummaryProps {
    orgId: string;
}

interface PlantillaOverview {
    totalLimit: number;
    totalFilled: number;
    totalRequested: number;
    totalApproved: number;
    totalAvailable: number;
}

export function OrgPlantillaSummary({ orgId }: OrgPlantillaSummaryProps) {
    const [overview, setOverview] = useState<PlantillaOverview | null>(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const data = await apiFetch<PlantillaOverview>(`/manpower/plantilla/overview/${orgId}`);
            setOverview(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (orgId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    if (loading || !overview) return null;

    return (
        <div className="grid grid-cols-4 gap-3">
            <Card className="bg-slate-50/50 border-slate-200">
                <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Filled</p>
                        <p className="text-sm font-bold">{formatNumber(overview.totalFilled)} / {formatNumber(overview.totalLimit)}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-100 text-blue-700">
                <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-blue-600/70 uppercase font-semibold">Requested</p>
                        <p className="text-sm font-bold">{formatNumber(overview.totalRequested)}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-amber-50/50 border-amber-100 text-amber-700">
                <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-amber-600/70 uppercase font-semibold">Recruiting</p>
                        <p className="text-sm font-bold">{formatNumber(overview.totalApproved)}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-100 text-emerald-700">
                <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-600/70 uppercase font-semibold">Available</p>
                        <p className="text-sm font-bold">{formatNumber(overview.totalAvailable)}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

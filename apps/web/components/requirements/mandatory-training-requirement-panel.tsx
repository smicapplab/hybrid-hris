'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
    Plus, Trash2, AlertCircle, Loader2, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AsyncSearchSelect } from '@/components/ui/async-search-select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface MandatoryTraining {
    id: string;
    programId: string;
    title: string;
    type: string;
}

interface ProgramOption {
    id: string;
    title: string;
    type: string;
}

type Props = {
    targetId: string;
    type: 'position' | 'org-unit';
};

export function MandatoryTrainingRequirementPanel({ targetId, type }: Props) {
    const { toast } = useToast();
    const [reqs, setReqs] = useState<MandatoryTraining[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    // Form state
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [removingProgram, setRemovingProgram] = useState<{ id: string; title: string } | null>(null);

    const loadReqs = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = type === 'position'
                ? `/training/mandatory/positions/${targetId}`
                : `/training/mandatory/org-units/${targetId}`;

            const data = await apiFetch<MandatoryTraining[]>(endpoint);
            setReqs(data);
        } catch (err) {
            console.error('Failed to load mandatory trainings', err);
        } finally {
            setLoading(false);
        }
    }, [targetId, type]);

    useEffect(() => {
        loadReqs();
    }, [loadReqs]);

    const fetchPrograms = async (s: string): Promise<ProgramOption[]> => {
        const res = await apiFetch<ProgramOption[]>(`/training/programs`);
        return res.filter(p => p.title.toLowerCase().includes(s.toLowerCase()));
    };

    const handleAdd = async () => {
        if (!selectedProgramId) return;
        try {
            setAdding(true);
            const endpoint = type === 'position'
                ? '/training/mandatory/positions'
                : '/training/mandatory/org-units';

            const payload = { targetId, programId: selectedProgramId };

            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast({ title: 'Mandatory training added', variant: 'success' });
            setSelectedProgramId(null);
            loadReqs();
        } catch {
            toast({ title: 'Failed to add training', variant: 'destructive' });
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (programId: string) => {
        try {
            const endpoint = type === 'position'
                ? `/training/mandatory/positions/${targetId}/${programId}`
                : `/training/mandatory/org-units/${targetId}/${programId}`;

            await apiFetch(endpoint, {
                method: 'DELETE'
            });
            toast({ title: 'Mandatory training removed', variant: 'success' });
            loadReqs();
        } catch {
            toast({ title: 'Failed to remove training', variant: 'destructive' });
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-sm">Loading requirements…</div>;

    return (
        <div className="space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <BookOpen className="w-4 h-4" />
                    <h3 className="text-xs uppercase tracking-widest">Mandatory Programs</h3>
                </div>
            </div>

            {/* Add Form */}
            <Card className="bg-muted/20 border-dashed border-border/60">
                <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 space-y-1.5 min-w-0 w-full">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Select Program</p>
                        <AsyncSearchSelect
                            placeholder="Search training catalog..."
                            value={selectedProgramId}
                            onChangeAction={setSelectedProgramId}
                            fetchOptions={fetchPrograms}
                            getOptionLabel={(o) => o.title}
                            getOptionValue={(o) => o.id}
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedProgramId || adding}
                        className="h-10 px-6 gap-2 font-bold uppercase text-[10px]"
                    >
                        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add
                    </Button>
                </CardContent>
            </Card>

            {/* List */}
            <div className="grid grid-cols-1 gap-2">
                {reqs.length === 0 ? (
                    <div className="py-12 text-center border-dashed border rounded-xl bg-muted/5">
                        <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground italic">No mandatory programs assigned.</p>
                    </div>
                ) : (
                    reqs.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/5 transition-colors border-border/60">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">{r.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[9px] h-4.5 font-bold uppercase shadow-none opacity-70">
                                        {r.type}
                                    </Badge>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => setRemovingProgram({ id: r.programId, title: r.title })}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                open={!!removingProgram}
                onOpenChange={(o) => !o && setRemovingProgram(null)}
                title="Remove Mandatory Training"
                description={`Are you sure you want to remove ${removingProgram?.title} as a requirement?`}
                onConfirm={async () => {
                    if (removingProgram) {
                        await handleRemove(removingProgram.id);
                        setRemovingProgram(null);
                    }
                }}
                variant="destructive"
            />
        </div>
    );
}

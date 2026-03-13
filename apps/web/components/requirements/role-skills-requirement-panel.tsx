'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
    Plus, Trash2, Target, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { PROFICIENCY_LEVEL_OPTIONS } from '@/lib/employee.enum';
import { AsyncSearchSelect } from '@/components/ui/async-search-select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PositionSkill {
    id: string;
    skillId: string;
    skillName: string;
    skillType: string;
    requiredProficiencyLevel: string;
}

interface SkillOption {
    id: string;
    label: string;
    category: string;
}

interface TaxonomyCategory {
    id: string;
    name: string;
    skills: { id: string; name: string }[];
}

type Props = {
    positionId: string;
};

export function RoleSkillsRequirementPanel({ positionId }: Props) {
    const { toast } = useToast();
    const [reqs, setReqs] = useState<PositionSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    // Form state
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const [targetLevel, setTargetLevel] = useState<string>('INTERMEDIATE');

    const loadReqs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiFetch<PositionSkill[]>(`/skills/positions/${positionId}`);
            setReqs(data);
        } catch (err) {
            console.error('Failed to load position skills', err);
        } finally {
            setLoading(false);
        }
    }, [positionId]);

    useEffect(() => {
        loadReqs();
    }, [loadReqs]);

    const fetchSkills = async (s: string): Promise<SkillOption[]> => {
        const res = await apiFetch<TaxonomyCategory[]>(`/skills/taxonomy`);
        const list: SkillOption[] = [];
        res.forEach(cat => {
            cat.skills.forEach((sk) => {
                if (sk.name.toLowerCase().includes(s.toLowerCase())) {
                    list.push({ id: sk.id, label: sk.name, category: cat.name });
                }
            });
        });
        return list;
    };

    const handleAdd = async () => {
        if (!selectedSkillId) return;
        try {
            setAdding(true);
            await apiFetch('/skills/positions', {
                method: 'POST',
                body: JSON.stringify({
                    positionId,
                    skillId: selectedSkillId,
                    requiredProficiencyLevel: targetLevel
                })
            });
            toast({ title: 'Skill requirement added', variant: 'success' });
            setSelectedSkillId(null);
            loadReqs();
        } catch {
            toast({ title: 'Failed to add skill', variant: 'destructive' });
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (skillId: string) => {
        try {
            await apiFetch(`/skills/positions/${positionId}/${skillId}`, {
                method: 'DELETE'
            });
            toast({ title: 'Skill requirement removed', variant: 'success' });
            loadReqs();
        } catch {
            toast({ title: 'Failed to remove skill', variant: 'destructive' });
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-sm">Loading competencies…</div>;

    return (
        <div className="space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Target className="w-4 h-4" />
                    <h3 className="text-xs uppercase tracking-widest">Required Competencies</h3>
                </div>
            </div>

            {/* Add Form */}
            <Card className="bg-muted/20 border-dashed border-border/60">
                <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 space-y-1.5 min-w-0 w-full">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Select Skill</p>
                        <AsyncSearchSelect
                            placeholder="Search skill catalog..."
                            value={selectedSkillId}
                            onChangeAction={setSelectedSkillId}
                            fetchOptions={fetchSkills}
                            getOptionLabel={(o) => o.label}
                            getOptionValue={(o) => o.id}
                        />
                    </div>
                    <div className="w-full sm:w-40 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Target Level</p>
                        <Select value={targetLevel} onValueChange={setTargetLevel}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PROFICIENCY_LEVEL_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedSkillId || adding}
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
                        <p className="text-xs text-muted-foreground italic">No skill requirements defined for this position.</p>
                    </div>
                ) : (
                    reqs.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/5 transition-colors border-border/60">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">{r.skillName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[9px] h-4.5 font-bold uppercase shadow-none">
                                        Target: {r.requiredProficiencyLevel}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight opacity-60">
                                        {r.skillType}
                                    </span>
                                </div>
                            </div>
                            <ConfirmDialog
                                title="Remove Skill Requirement"
                                description={`Are you sure you want to remove ${r.skillName} as a requirement for this position?`}
                                onConfirm={() => handleRemove(r.skillId)}
                                variant="destructive"
                                trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                }
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

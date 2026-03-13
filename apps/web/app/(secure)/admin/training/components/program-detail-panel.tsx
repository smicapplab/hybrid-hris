'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil, Library, GraduationCap, Link as LinkIcon, Info, Calendar, Plus, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TrainingProgram } from '@/types/training.types';
import { Skill } from '@/types/skills.types';
import { ScheduleList } from './schedule-list';
import { TrainingFeedbackPanel } from './training-feedback-panel';
import { AsyncSearchSelect } from '@/components/ui/async-search-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Props = {
  programId: string;
  onEditAction: (prog: TrainingProgram) => void;
  onUpdateSuccessAction: () => void;
  onManageAttendeesAction: (scheduleId: string, title: string) => void;
};

export function ProgramDetailPanel({ programId, onEditAction, onManageAttendeesAction }: Props) {
  const { toast } = useToast();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProgram = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<TrainingProgram>(`/training/programs/${programId}`);
      setProgram(result);
    } catch (err) {
      toast({
        title: 'Failed to load program details',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [programId, toast]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  const handleAddSkill = async (skillId: string, level: string) => {
    if (!program) return;
    try {
      const currentSkills = program.skills?.map(s => ({ id: s.skillId, level: s.grantedProficiencyLevel })) || [];
      await apiFetch(`/training/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          skillIds: [...currentSkills, { id: skillId, level }]
        })
      });
      await loadProgram();
      toast({ title: 'Skill added', variant: 'success' });
    } catch (err: unknown) {
      toast({
        title: 'Failed to add skill',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!program) return;
    try {
      const currentSkills = program.skills?.filter(s => s.skillId !== skillId).map(s => ({ id: s.skillId, level: s.grantedProficiencyLevel })) || [];
      await apiFetch(`/training/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify({ skillIds: currentSkills })
      });
      await loadProgram();
      toast({ title: 'Skill removed', variant: 'success' });
    } catch (err: unknown) {
      toast({
        title: 'Failed to remove skill',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAddPrereq = async (pid: string) => {
    if (!program) return;
    try {
      const currentPrereqs = program.prerequisites?.map(p => p.prerequisiteProgramId) || [];
      await apiFetch(`/training/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          prerequisiteIds: [...currentPrereqs, pid]
        })
      });
      await loadProgram();
      toast({ title: 'Prerequisite added', variant: 'success' });
    } catch (err: unknown) {
      toast({
        title: 'Failed to add prerequisite',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRemovePrereq = async (pid: string) => {
    if (!program) return;
    try {
      const currentPrereqs = program.prerequisites?.filter(p => p.prerequisiteProgramId !== pid).map(p => p.prerequisiteProgramId) || [];
      await apiFetch(`/training/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify({ prerequisiteIds: currentPrereqs })
      });
      await loadProgram();
      toast({ title: 'Prerequisite removed', variant: 'success' });
    } catch (err: unknown) {
      toast({
        title: 'Failed to remove prerequisite',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading && !program) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading program details...</p>
      </div>
    );
  }

  if (!program) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 rounded-xl border bg-card shadow-sm">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{program.title}</h2>
              {program.isMandatory && (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 uppercase font-bold">Mandatory</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground uppercase">{program.type}</span>
              <span className="text-xs text-muted-foreground">• Template</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shadow-sm" onClick={() => onEditAction(program)}>
          <Pencil className="w-3.5 h-3.5" /> Edit Basic Info
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-120 h-10 p-1 bg-muted/50 rounded-lg">
          <TabsTrigger value="overview" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
            <Info className="w-3.5 h-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
            <Calendar className="w-3.5 h-3.5" /> Schedules
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
            <Star className="w-3.5 h-3.5" /> Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="rounded-xl border p-4 space-y-3 bg-card shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Description</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed min-h-15">
                  {program.description || 'No description provided.'}
                </p>
              </div>

              <div className="rounded-xl border p-4 space-y-3 bg-card shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Objectives</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed min-h-15">
                  {program.objectives || 'No objectives defined.'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Skills Granting */}
              <div className="rounded-xl border p-4 space-y-4 bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <GraduationCap className="w-4 h-4" />
                    <h3 className="text-xs uppercase tracking-widest text-foreground">Granted Skills</h3>
                  </div>
                  <AddSkillPopover onAdd={handleAddSkill} existingIds={program.skills?.map(s => s.skillId) || []} />
                </div>
                <div className="space-y-2">
                  {!program.skills?.length && (
                    <p className="text-[11px] text-muted-foreground italic text-center py-4 bg-muted/10 rounded-lg border border-dashed">
                      No skills linked.
                    </p>
                  )}
                  {program.skills?.map((ps) => (
                    <div key={ps.id} className="group flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 hover:border-primary/30 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{ps.skillName}</span>
                        <Badge variant="secondary" className="text-[9px] h-4 w-fit uppercase font-mono mt-1 text-foreground">
                          {ps.grantedProficiencyLevel}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleRemoveSkill(ps.skillId)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              <div className="rounded-xl border p-4 space-y-4 bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-600 font-bold">
                    <LinkIcon className="w-4 h-4" />
                    <h3 className="text-xs uppercase tracking-widest text-foreground">Prerequisites</h3>
                  </div>
                  <AddPrereqPopover onAdd={handleAddPrereq} existingIds={[programId, ...(program.prerequisites?.map(p => p.prerequisiteProgramId) || [])]} />
                </div>
                <div className="space-y-2">
                  {!program.prerequisites?.length && (
                    <p className="text-[11px] text-muted-foreground italic text-center py-4 bg-muted/10 rounded-lg border border-dashed">
                      No prerequisites defined.
                    </p>
                  )}
                  {program.prerequisites?.map((pre) => (
                    <div key={pre.id} className="group flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 hover:border-orange-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        <span className="text-sm font-medium text-foreground">{pre.title}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleRemovePrereq(pre.prerequisiteProgramId)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="mt-6">
          <ScheduleList 
            programId={programId} 
            programTitle={program.title}
            onManageAttendeesAction={onManageAttendeesAction} 
          />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <TrainingFeedbackPanel programId={programId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TaxonomyCategory {
  id: string;
  name: string;
  skills: Skill[];
}

function AddSkillPopover({ onAdd, existingIds }: { onAdd: (id: string, level: string) => void, existingIds: string[] }) {
  const [skillId, setSkillId] = useState<string | null>(null);
  const [level, setLevel] = useState('BEGINNER');
  const [open, setOpen] = useState(false);

  const fetchSkills = useCallback(async (s: string) => {
    const res = await apiFetch<TaxonomyCategory[]>('/skills/taxonomy');
    return res.flatMap(c => c.skills).filter(sk => sk.name.toLowerCase().includes(s.toLowerCase()));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 shadow-none">
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h4 className="text-sm font-bold leading-none text-foreground">Add Skill</h4>
          <AsyncSearchSelect<Skill>
            placeholder="Search skill..."
            value={skillId}
            excludeIds={existingIds}
            onChangeAction={setSkillId}
            fetchOptions={fetchSkills}
            getOptionLabel={o => o.name}
            getOptionValue={o => o.id}
          />
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Grant Level</Label>
            <select className="w-full text-xs rounded-md border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-primary" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
          <Button size="sm" className="w-full shadow-sm" disabled={!skillId} onClick={() => {
            if (skillId) onAdd(skillId, level);
            setSkillId(null);
            setOpen(false);
          }}>Add to Program</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AddPrereqPopover({ onAdd, existingIds }: { onAdd: (id: string) => void, existingIds: string[] }) {
  const [pid, setPid] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchPrograms = useCallback(async (s: string) => {
    const res = await apiFetch<TrainingProgram[]>('/training/programs');
    return res.filter(p => p.title.toLowerCase().includes(s.toLowerCase()));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:bg-orange-50 shadow-none">
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h4 className="text-sm font-bold leading-none text-foreground">Add Prerequisite</h4>
          <AsyncSearchSelect<TrainingProgram>
            placeholder="Search program..."
            value={pid}
            excludeIds={existingIds}
            onChangeAction={setPid}
            fetchOptions={fetchPrograms}
            getOptionLabel={o => o.title}
            getOptionValue={o => o.id}
          />
          <Button size="sm" className="w-full shadow-sm" variant="outline" disabled={!pid} onClick={() => {
            if (pid) onAdd(pid);
            setPid(null);
            setOpen(false);
          }}>Add Requirement</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

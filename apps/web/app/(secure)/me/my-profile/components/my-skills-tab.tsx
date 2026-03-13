'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Plus, Trash2, ExternalLink, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SkillDeclarationDialog } from './skill-declaration-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Endorsement {
  id: string;
  endorserName: string;
  message: string | null;
  createdAt: string;
}

interface EmployeeSkill {
  id: string;
  skillId: string;
  skillName: string;
  skillType: string;
  proficiencyLevel: string;
  source: string;
  verificationStatus: string;
  acquiredDate: string;
  expiryDate: string | null;
  evidenceUrl: string | null;
  notes: string | null;
  verifiedAt: string | null;
  endorsements: Endorsement[];
}

export function MySkillsTab() {
  const { toast } = useToast();
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<EmployeeSkill[]>('/skills/my-skills');
      setSkills(result);
    } catch (err: any) {
      toast({
        title: 'Failed to load skills',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  async function handleConfirmRemove() {
    if (!skillToDelete) return;
    try {
      await apiFetch(`/skills/my-skills/${skillToDelete}`, { method: 'DELETE' });
      toast({ title: 'Skill removed successfully', variant: 'success' });
      loadSkills();
      } catch (err: any) {
      toast({
        title: 'Failed to remove skill',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
      } finally {
      setSkillToDelete(null);
    }
  }

  if (loading && skills.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading your skills…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Skill Profile</h2>
          <p className="text-xs text-muted-foreground">Manage your verified skills and professional competencies.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Declare Skill
        </Button>
      </div>

      {skills.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="text-sm font-medium">No skills found</p>
              <p className="text-xs text-muted-foreground mt-1">Start building your profile by declaring your skills.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="mt-2">
              Add your first skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((s) => (
            <Card key={s.id} className={cn(
              "group overflow-hidden transition-all hover:border-primary/30 text-foreground",
              s.verificationStatus === 'VERIFIED' ? "bg-card" : "bg-muted/10 opacity-80"
            )}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{s.skillName}</h3>
                      <Badge variant="outline" className="text-[9px] uppercase h-4 px-1.5 font-mono">{s.skillType}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.verificationStatus === 'VERIFIED' ? 'default' : 'secondary'} className="text-[9px] uppercase h-4 px-1.5 font-bold">
                        {s.verificationStatus}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {s.proficiencyLevel}
                      </span>
                    </div>
                  </div>
                  {s.verificationStatus !== 'VERIFIED' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSkillToDelete(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {s.verificationStatus === 'VERIFIED' && (
                    <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Source</span>
                    <p className="text-[11px] font-medium text-foreground uppercase tracking-tight truncate">{s.source.replace('_', ' ')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Acquired</span>
                    <p className="text-[11px] font-medium text-foreground">{new Date(s.acquiredDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {(s.evidenceUrl || s.notes) && (
                  <div className="p-2.5 rounded-lg bg-muted/30 space-y-2">
                    {s.notes && <p className="text-[11px] text-muted-foreground leading-relaxed italic">&ldquo;{s.notes}&rdquo;</p>}
                    {s.evidenceUrl && (
                      <a href={s.evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold hover:underline">
                        <ExternalLink className="w-3 h-3" /> View Evidence
                      </a>
                    )}
                  </div>
                )}

                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      <MessageSquare className="w-3 h-3" /> Peer Endorsements ({s.endorsements.length})
                    </div>
                  </div>
                  {s.endorsements.length > 0 ? (
                    <div className="space-y-2">
                      {s.endorsements.map((e) => (
                        <div key={e.id} className="text-[10px] bg-background/50 p-2 rounded border border-border/20">
                          <div className="flex justify-between font-bold text-foreground">
                            <span>{e.endorserName}</span>
                            <span className="text-muted-foreground/60">{new Date(e.createdAt).toLocaleDateString()}</span>
                          </div>
                          {e.message && <p className="mt-1 text-muted-foreground italic leading-tight">{e.message}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-muted-foreground italic px-1">No endorsements yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SkillDeclarationDialog
        open={dialogOpen}
        onOpenChangeAction={setDialogOpen}
        onSuccessAction={loadSkills}
      />

      <ConfirmDialog 
        open={!!skillToDelete}
        onOpenChange={(open) => !open && setSkillToDelete(null)}
        title="Remove Skill Declaration"
        description="Are you sure you want to remove this skill from your profile? This action cannot be undone."
        onConfirm={handleConfirmRemove}
        confirmText="Remove Skill"
        variant="destructive"
      />
    </div>
  );
}

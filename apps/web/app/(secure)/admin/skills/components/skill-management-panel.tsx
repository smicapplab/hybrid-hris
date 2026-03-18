'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, ShieldCheck, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skill, SkillCategory } from '@/types/skills.types';
import { SkillDialog } from './skill-dialog';
import { cn } from '@/lib/utils';

type Props = {
  category: SkillCategory;
};

export function SkillManagementPanel({ category }: Props) {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<Skill[]>(`/skills/categories/${category.id}/skills`);
      setSkills(result);
    } catch (err) {
      toast({
        title: 'Failed to load skills',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [category.id, toast]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-start justify-between gap-4 p-5 rounded-xl border bg-linear-to-br from-card to-muted/20 shadow-sm">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{category.name}</h2>
            {category.description ? (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed italic">
                {category.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1 italic">No description provided.</p>
            )}
            <div className="flex gap-4 mt-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                {skills.length} Total Skills
              </div>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => {
          setEditingSkill(null);
          setDialogOpen(true);
        }} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Skill
        </Button>
      </div>

      {/* Skills Grid/List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Skills List
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs bg-background shadow-sm"
              placeholder="Filter skills in this category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center rounded-xl border border-dashed bg-muted/20">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-5 h-5 text-muted-foreground opacity-50" />
              </div>
              <p className="text-sm text-muted-foreground">No skills found in this category.</p>
            </div>
          )}

          {filtered.map((skill) => (
            <div
              key={skill.id}
              className={cn(
                "group relative p-4 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md",
                !skill.isActive && "opacity-60 bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-semibold text-sm truncate">{skill.name}</h4>
                    <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-mono uppercase bg-muted/50">
                      {skill.type}
                    </Badge>
                  </div>
                  {skill.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {skill.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-auto pt-1 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                      <Clock className="w-3 h-3" />
                      {skill.expiryMonths ? `${skill.expiryMonths}M Expiry` : 'No Expiry'}
                    </div>
                    {!skill.isActive && (
                      <div className="flex items-center gap-1 text-[10px] text-destructive font-bold uppercase">
                        <AlertCircle className="w-3 h-3" /> Deactivated
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setEditingSkill(skill);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SkillDialog
        open={dialogOpen}
        onOpenChangeAction={setDialogOpen}
        categoryId={category.id}
        initialData={editingSkill}
        onSuccessAction={loadSkills}
      />
    </div>
  );
}

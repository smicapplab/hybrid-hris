'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  ShieldAlert, CheckCircle2,
  TrendingUp, Search, ArrowRight,
  Target, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SkillCell {
  skillId: string;
  status: 'MET' | 'BELOW' | 'MISSING' | 'NA';
  actual?: string;
  target?: string;
  skillName?: string; // We'll map this from the header
}

interface SkillGapData {
  skills: { id: string; name: string }[];
  grid: {
    employeeId: string;
    employeeName: string;
    positionTitle: string | null;
    cells: SkillCell[];
  }[];
}

export function TeamSkillGapTab() {
  const { toast } = useToast();
  const [data, setData] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadGap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<SkillGapData>('/skills/team-gap');
      setData(res);
    } catch {
      toast({ title: 'Failed to load readiness dashboard', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGap();
  }, [loadGap]);

  if (loading) return <div className="p-12 text-center animate-pulse text-sm text-foreground font-medium">Analyzing team readiness…</div>;

  if (!data || data.grid.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-muted/5 rounded-2xl border border-dashed text-foreground">
        <Target className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground italic text-center">No role baselines found.<br />Set position requirements in Admin to enable analysis.</p>
      </div>
    );
  }

  const filteredGrid = data.grid.filter(g =>
    g.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    g.positionTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-foreground">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/20 border-emerald-100 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Team Readiness</p>
              <p className="text-xl font-black">
                {Math.round((data.grid.reduce((acc, row) => {
                  const met = row.cells.filter(c => c.status === 'MET').length;
                  const total = row.cells.filter(c => c.status !== 'NA').length;
                  return acc + (total > 0 ? (met / total) : 1);
                }, 0) / data.grid.length) * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 flex items-end">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search team member or role..."
              className="pl-9 h-11 bg-muted/20 border-border/40 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actionable Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredGrid.map((row) => {
          const requiredCells = row.cells.filter(c => c.status !== 'NA');
          const metCount = requiredCells.filter(c => c.status === 'MET').length;
          const belowCount = requiredCells.filter(c => c.status === 'BELOW').length;
          const missingCount = requiredCells.filter(c => c.status === 'MISSING').length;
          const totalReq = requiredCells.length;
          const matchPercent = totalReq > 0 ? Math.round((metCount / totalReq) * 100) : 100;

          return (
            <Card key={row.employeeId} className="group hover:border-primary/30 transition-all border-border/60 bg-card overflow-hidden shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">

                  {/* Left: Identity & Fit */}
                  <div className="p-5 md:w-72 border-b md:border-b-0 md:border-r border-border/40 bg-muted/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 text-xs">
                        {row.employeeName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate leading-tight group-hover:text-primary transition-colors">{row.employeeName}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase truncate tracking-tighter">{row.positionTitle || 'No Role'}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Role Fit</span>
                        <span className={cn(matchPercent === 100 ? "text-emerald-600" : "text-foreground")}>{matchPercent}%</span>
                      </div>
                      <Progress value={matchPercent} className="h-1.5" />
                      <p className="text-[9px] text-muted-foreground italic font-medium pt-1">
                        {metCount} of {totalReq} skills met
                      </p>
                    </div>
                  </div>

                  {/* Right: The Badges (Gaps) */}
                  <div className="flex-1 p-5 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-6 items-start">

                      {/* Critical Gaps */}
                      {missingCount > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-1.5 leading-none">
                            <ShieldAlert className="w-3 h-3" /> Critical Gaps ({missingCount})
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {row.cells.filter(c => c.status === 'MISSING').map(c => {
                              const name = data.skills.find(s => s.id === c.skillId)?.name;
                              return (
                                <Badge key={c.skillId} variant="outline" className="bg-red-50 text-red-700 border-red-100 hover:bg-red-50 text-[10px] font-bold h-6 shadow-none px-2.5">
                                  {name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Growth Needs */}
                      {belowCount > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5 leading-none">
                            <TrendingUp className="w-3 h-3" /> Growth Needs ({belowCount})
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {row.cells.filter(c => c.status === 'BELOW').map(c => {
                              const name = data.skills.find(s => s.id === c.skillId)?.name;
                              return (
                                <Badge key={c.skillId} variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 text-[10px] font-bold h-6 shadow-none px-2.5">
                                  {name} <ArrowRight className="w-2.5 h-2.5 mx-1 opacity-50" /> {c.target}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Everything Met */}
                      {missingCount === 0 && belowCount === 0 && totalReq > 0 && (
                        <div className="flex flex-col items-center justify-center h-full py-2">
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">Fully Qualified for Role</span>
                          </div>
                        </div>
                      )}

                      {totalReq === 0 && (
                        <p className="text-[11px] text-muted-foreground italic font-medium">No skill requirements defined for this role.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Column (Subtle) */}
                  <div className="p-4 md:w-16 flex items-center justify-center border-t md:border-t-0 md:border-l border-border/40 bg-muted/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>

                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

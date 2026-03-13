'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, TrendingUp, ArrowRight,
  Target, ShieldAlert, Loader2, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SkillCell {
  skillId: string;
  status: 'MET' | 'BELOW' | 'MISSING' | 'NA';
  actual?: string;
  target?: string;
}

interface SkillGapRow {
    employeeId: string;
    employeeName: string;
    positionTitle: string | null;
    cells: SkillCell[];
}

interface SkillGapData {
  skills: { id: string; name: string }[];
  grid: SkillGapRow[];
  total: number;
  hasMore: boolean;
}

type Props = {
    recursive: boolean;
    search: string;
    scope?: string;
};

const LIMIT = 20;

export function TeamSkillGapTab({ recursive, search, scope = 'downline' }: Props) {
  const { toast } = useToast();
  
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<SkillGapRow[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadData = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        recursive: String(recursive),
        search: search,
        offset: String(currentOffset),
        limit: String(LIMIT),
        scope: scope
      });

      const res = await apiFetch<SkillGapData>(`/skills/team-gap?${params.toString()}`);
      
      setSkills(res.skills);
      setTotal(res.total);
      setHasMore(res.hasMore);
      
      if (append) {
        setRows(prev => [...prev, ...res.grid]);
      } else {
        setRows(res.grid);
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load readiness data',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [recursive, search, toast, scope]);

  // Reset and load on filter change
  useEffect(() => {
    setOffset(0);
    loadData(0, false);
  }, [loadData]);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    loadData(nextOffset, true);
  };

  if (loading && offset === 0) return <div className="p-12 text-center animate-pulse text-sm text-foreground font-medium">Analyzing team readiness…</div>;
  
  if (rows.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-muted/5 rounded-2xl border border-dashed text-foreground">
        <Target className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground italic text-center">No matching team members found.</p>
      </div>
    );
  }

  const teamReadiness = rows.length > 0 ? Math.round((rows.reduce((acc, row) => {
    const met = row.cells.filter(c => c.status === 'MET').length;
    const totalReq = row.cells.filter(c => c.status !== 'NA').length;
    return acc + (totalReq > 0 ? (met / totalReq) : 1);
  }, 0) / rows.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-foreground pb-10">
      {/* Stats Summary */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Readiness</span>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">{teamReadiness}%</span>
                    <Progress value={teamReadiness} className="w-24 h-1.5" />
                </div>
            </div>
            <div className="h-8 w-px bg-border/60 mx-2 hidden sm:block" />
            <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Analyzed</span>
                <span className="text-lg font-bold">{total} Members</span>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-green-500 shadow-sm" /><span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Met</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500 shadow-sm" /><span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Growth</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-500 shadow-sm" /><span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Missing</span></div>
        </div>
      </div>

      {/* Readiness Cards */}
      <div className="grid grid-cols-1 gap-4">
        {rows.map((row) => {
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
                  
                  {/* Left: Identity */}
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
                            <span className={cn(matchPercent === 100 ? "text-emerald-600 font-black" : "text-foreground")}>{matchPercent}%</span>
                        </div>
                        <Progress value={matchPercent} className="h-1.5" />
                    </div>
                  </div>

                  {/* Right: Gaps */}
                  <div className="flex-1 p-5 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-6 items-start">
                        {missingCount > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-[9px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                                    <ShieldAlert className="w-3 h-3" /> Critical Gaps ({missingCount})
                                </h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {row.cells.filter(c => c.status === 'MISSING').map(c => (
                                        <Badge key={c.skillId} variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[10px] font-bold h-6 shadow-none px-2.5">
                                            {skills.find(s => s.id === c.skillId)?.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {belowCount > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-[9px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
                                    <TrendingUp className="w-3 h-3" /> Growth Needs ({belowCount})
                                </h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {row.cells.filter(c => c.status === 'BELOW').map(c => (
                                        <Badge key={c.skillId} variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] font-bold h-6 shadow-none px-2.5">
                                            {skills.find(s => s.id === c.skillId)?.name} <ArrowRight className="w-2.5 h-2.5 mx-1 opacity-50" /> {c.target}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {missingCount === 0 && belowCount === 0 && totalReq > 0 && (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[11px] font-bold uppercase tracking-tight">Fully Qualified</span>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-4">
            <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 font-bold uppercase text-[10px] h-9 px-8 rounded-full border-border/60 hover:bg-muted/50"
                onClick={handleLoadMore}
                disabled={loadingMore}
            >
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Show More ({total - rows.length} remaining)
            </Button>
        </div>
      )}
    </div>
  );
}

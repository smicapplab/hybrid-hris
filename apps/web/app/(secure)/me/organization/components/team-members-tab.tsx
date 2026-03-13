'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, ChevronRight, ChevronDown, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string;
    positionTitle: string | null;
    status: string;
}

interface PaginatedResponse {
    data: TeamMember[];
    total: number;
    hasMore: boolean;
}

type Props = {
  onSelectEmployeeAction: (id: string) => void;
  recursive: boolean;
  search: string;
  scope?: string;
};

const LIMIT = 20;

/* ─── Avatar helper ─────────────────────────────────────────── */
function Avatar({ name, className }: { name: string; className?: string }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    return (
        <div className={cn(
            'rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs shrink-0',
            className,
        )}>
            {initials}
        </div>
    )
}

export function TeamMembersTab({ onSelectEmployeeAction, recursive, search, scope = 'downline' }: Props) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadMembers = useCallback(async (currentOffset: number, append: boolean = false) => {
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

      const res = await apiFetch<PaginatedResponse>(`/profile/me/team-members?${params.toString()}`);
      
      setTotal(res.total);
      setHasMore(res.hasMore);
      
      if (append) {
        setMembers(prev => [...prev, ...res.data]);
      } else {
        setMembers(res.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load team members', err);
      toast({
        title: 'Failed to load team members',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [recursive, search, toast, scope]);

  useEffect(() => {
    setOffset(0);
    loadMembers(0, false);
  }, [loadMembers]);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    loadMembers(nextOffset, true);
  };

  if (loading && offset === 0) return <div className="p-12 text-center animate-pulse text-sm text-foreground font-medium">Loading team members…</div>;

  if (members.length === 0 && !loading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-muted/5 rounded-2xl border border-dashed text-foreground">
          <Users className="w-12 h-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground italic text-center">No matching team members found.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-foreground pb-10">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">
            {recursive ? 'My Managed Team' : 'My Direct Reports'} ({total})
        </h3>
        <span className="text-[10px] text-muted-foreground italic font-medium">Click card to view details</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
            <Card key={m.id} className="hover:border-primary/50 transition-all bg-card border-border/60 shadow-none cursor-pointer group" onClick={() => onSelectEmployeeAction(m.id)}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={`${m.firstName} ${m.lastName}`} className="w-9 h-9 border group-hover:border-primary/30 transition-colors" />
                        <div className="min-w-0">
                            <p className="text-sm font-bold leading-tight truncate text-foreground group-hover:text-primary transition-colors">{m.firstName} {m.lastName}</p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5 uppercase tracking-tight">{m.positionTitle || 'No Position'}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </CardContent>
            </Card>
        ))}
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
                Show More ({total - members.length} remaining)
            </Button>
        </div>
      )}
    </div>
  );
}

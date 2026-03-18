'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Star, MessageSquare, User, Calendar, Loader2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrainingFeedbackInfo, PaginatedFeedbackResponse } from '@/types/training.types';

const LIMIT = 20;

export function TrainingFeedbackPanel({ programId }: { programId?: string }) {
  const { toast } = useToast();
  const [data, setData] = useState<TrainingFeedbackInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadFeedback = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        offset: String(currentOffset),
        limit: String(LIMIT)
      });

      if (programId) {
        params.append('programId', programId);
      }

      const res = await apiFetch<PaginatedFeedbackResponse>(`/training/feedback?${params.toString()}`);

      setTotal(res.total);
      setAvgRating(res.averageRating);
      setHasMore(res.hasMore);

      if (append) {
        setData(prev => [...prev, ...res.data]);
      } else {
        setData(res.data);
      }
    } catch (err: unknown) {
      toast({
        title: 'Failed to load feedback',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast, programId]);

  useEffect(() => {
    loadFeedback(0, false);
  }, [loadFeedback, programId]);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    loadFeedback(nextOffset, true);
  };

  return (
    <div className="space-y-6 text-foreground pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-current" /> Training Ratings & Feedback
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review evaluations and comments from participants across all sessions.
          </p>
        </div>

        <Card className="bg-amber-50/10 border-amber-100 shadow-none">
          <CardContent className="py-3 px-6 flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Average Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-amber-700">{avgRating.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-3 h-3", s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-px h-10 bg-amber-100 mx-2" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Total Reviews</p>
              <p className="text-xl font-bold text-foreground">{total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-[10px] uppercase font-bold text-foreground">Participant</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-foreground">Program & Session</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-foreground">Trainer</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-foreground w-32">Rating</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-foreground">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin opacity-40" />
                    <span className="text-xs font-medium italic">Loading feedback...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-xs">
                  No feedback submitted yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((r) => (
                <TableRow key={r.id} className="group border-border/40 hover:bg-muted/5">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{r.employeeName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{r.employeeNo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{r.programTitle}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.sessionDate).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {r.trainerName || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">Submitted {new Date(r.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {r.comments ? (
                      <div className="flex gap-2 items-start py-1">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                          &quot;{r.comments}&quot;
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30 italic">No comments</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
            Show More ({total - data.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

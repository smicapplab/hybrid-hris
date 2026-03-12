'use client';

import { Calendar, Search, History, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import type { MyTraining } from '../page';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type Props = {
  trainings: MyTraining[];
  loading: boolean;
  selectedId: string | null;
  onSelectAction: (id: string) => void;
  tab: 'upcoming' | 'history';
  onTabChangeAction: (tab: 'upcoming' | 'history') => void;
};

export function TrainingListPanel({
  trainings,
  loading,
  selectedId,
  onSelectAction,
  tab,
  onTabChangeAction,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return trainings.filter((t) => {
      const isSearchMatch = t.programTitle.toLowerCase().includes(search.toLowerCase());
      if (!isSearchMatch) return false;

      const startDate = new Date(t.startAt);

      if (tab === 'upcoming') {
        // Enrolled and not yet completed/cancelled in the past
        return t.enrollmentStatus === 'ENROLLED' && (startDate >= now || t.status !== 'COMPLETED');
      } else {
        // Any status in the last 6 months that isn't in "Upcoming"
        return startDate >= sixMonthsAgo && (startDate < now || t.status === 'COMPLETED' || t.enrollmentStatus === 'CANCELLED');
      }
    });
  }, [trainings, search, tab]);

  return (
    <div className="h-full flex flex-col bg-muted/10 border-r">
      {/* Search & Tabs */}
      <div className="p-4 space-y-4 shrink-0 border-b bg-background/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs bg-background"
            placeholder="Search my trainings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => onTabChangeAction(v as 'upcoming' | 'history')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-8 p-1">
            <TabsTrigger value="upcoming" className="text-[10px] uppercase font-bold gap-2">
              <Calendar className="w-3 h-3" /> Upcoming
            </TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] uppercase font-bold gap-2">
              <History className="w-3 h-3" /> History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading your trainings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <GraduationCap className="w-8 h-8 text-muted-foreground opacity-20" />
            <p className="text-xs text-muted-foreground font-medium italic">
              No trainings found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((t) => {
              const isSelected = selectedId === t.id;
              const date = new Date(t.startAt);

              return (
                <button
                  key={t.id}
                  className={cn(
                    "w-full flex flex-col gap-2 p-4 text-left transition-all hover:bg-muted/50 relative",
                    isSelected ? "bg-primary/5 shadow-sm" : ""
                  )}
                  onClick={() => onSelectAction(t.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold line-clamp-2 leading-snug">
                      {t.programTitle}
                    </span>
                    <Badge variant={t.enrollmentStatus === 'ENROLLED' ? 'default' : 'secondary'} className="text-[9px] h-4 px-1.5 uppercase font-bold shrink-0">
                      {t.enrollmentStatus}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter",
                        t.programType === 'INTERNAL' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                      )}>
                        {t.programType}
                      </span>
                      {t.isMandatory && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter bg-red-50 text-red-600 border border-red-100">
                          Mandatory
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

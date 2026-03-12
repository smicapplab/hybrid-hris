'use client';

import { Library, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { TrainingProgram } from '@/types/training.types';
import { cn } from '@/lib/utils';

type Props = {
  programs: TrainingProgram[];
  loading: boolean;
  selectedId: string | null;
  onSelectAction: (id: string) => void;
  onAddAction: () => void;
};

export function ProgramListPanel({
  programs,
  loading,
  selectedId,
  onSelectAction,
  onAddAction,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = programs.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-muted/10">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {loading ? '…' : `${programs.length} Program${programs.length !== 1 ? 's' : ''}`}
        </span>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={onAddAction}>
          <Plus className="w-3 h-3" /> New
        </Button>
      </div>

      <div className="px-3 pb-3 shrink-0 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs bg-background"
            placeholder="Search programs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !loading && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No training programs found.
          </div>
        )}

        {filtered.map((prog) => {
          const isSelected = selectedId === prog.id;

          return (
            <div
              key={prog.id}
              className={cn(
                "group relative w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-border/40 cursor-pointer",
                isSelected ? "bg-primary/5 text-primary border-r-2 border-r-primary" : "hover:bg-muted/50"
              )}
              onClick={() => onSelectAction(prog.id)}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                <Library className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{prog.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                    prog.type === 'INTERNAL' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {prog.type}
                  </span>
                  {prog.isMandatory && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase bg-red-50 text-red-600">
                      Mandatory
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

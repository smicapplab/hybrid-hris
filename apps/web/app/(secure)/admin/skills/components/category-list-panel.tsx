'use client';

import { FolderTree, Plus, Search, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { SkillCategory } from '@/types/skills.types';
import { cn } from '@/lib/utils';

type Props = {
  categories: SkillCategory[];
  loading: boolean;
  selectedId: string | null;
  onSelectAction: (id: string) => void;
  onAddAction: () => void;
  onEditAction: (cat: SkillCategory) => void;
};

export function CategoryListPanel({
  categories,
  loading,
  selectedId,
  onSelectAction,
  onAddAction,
  onEditAction,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {loading ? '…' : `${categories.length} Categor${categories.length !== 1 ? 'ies' : 'y'}`}
        </span>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={onAddAction}>
          <Plus className="w-3 h-3" /> New
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs bg-background"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !loading && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No categories found.
          </div>
        )}

        {filtered.map((cat) => {
          const isSelected = selectedId === cat.id;

          return (
            <div
              key={cat.id}
              className={cn(
                "group relative w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-border/40 cursor-pointer",
                isSelected ? "bg-primary/5 text-primary border-r-2 border-r-primary" : "hover:bg-muted/50"
              )}
              onClick={() => onSelectAction(cat.id)}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary"
                )}
              >
                <FolderTree className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{cat.name}</p>
                {cat.description && (
                  <p className="text-[11px] text-muted-foreground truncate line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditAction(cat);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

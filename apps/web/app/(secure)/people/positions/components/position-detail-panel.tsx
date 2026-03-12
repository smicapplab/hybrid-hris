'use client'

import { Button } from '@/components/ui/button'
import type { Position } from '@/types/position.types'
import { format } from 'date-fns'
import { Briefcase, Info, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    position: Position
    onEditAction: () => void
    onDeleteAction: () => void
    onRestoreAction: () => void
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    if (isActive) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
            </span>
        )
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            Inactive
        </span>
    )
}

export function PositionDetailPanel({
    position,
    onEditAction,
    onDeleteAction,
    onRestoreAction,
}: Props) {
    return (
        <div className="h-full overflow-y-auto space-y-4 pr-1">

            {/* ── Header card ── */}
            <div className={cn(
                'rounded-xl border p-5 space-y-4',
                !position.isActive
                    ? 'bg-zinc-50/60 border-zinc-200'
                    : 'bg-linear-to-br from-card to-muted/20 border-border shadow-sm',
            )}>
                {/* Icon + title + actions */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                            'mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                            !position.isActive ? 'bg-zinc-100' : 'bg-primary/10',
                        )}>
                            <Briefcase className={cn(
                                'w-5 h-5',
                                !position.isActive ? 'text-zinc-400' : 'text-primary',
                            )} />
                        </div>

                        <div className="min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold leading-tight">{position.title}</h2>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <code className="px-1.5 py-0.5 rounded-md bg-background text-xs font-mono text-muted-foreground border shadow-sm">
                                    {position.code}
                                </code>
                                <StatusBadge isActive={position.isActive} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        {position.isActive && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-xs"
                                    onClick={onEditAction}
                                >
                                    <Pencil className="w-3 h-3" />
                                    Edit
                                </Button>
                                {position.isDeletable && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 gap-1.5 text-xs"
                                        onClick={onDeleteAction}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                    </Button>
                                )}
                            </>
                        )}
                        {!position.isActive && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs"
                                onClick={onRestoreAction}
                            >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                            </Button>
                        )}
                    </div>
                </div>

                {/* Meta strip */}
                <div className="grid grid-cols-2 gap-x-6 pt-3 border-t border-border/50">
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created</p>
                        <p className="text-xs font-medium">{format(new Date(position.createdAt), 'PP')}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last Updated</p>
                        <p className="text-xs font-medium">{format(new Date(position.updatedAt), 'PP')}</p>
                    </div>
                </div>

                {/* Cannot-delete notice */}
                {position.isActive && !position.isDeletable && (
                    <div className="flex items-start gap-1.5 -mt-1 text-xs text-muted-foreground">
                        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
                        <span>Cannot delete: this position is assigned to one or more employees.</span>
                    </div>
                )}
            </div>

            {/* ── Description card ── */}
            <div className="rounded-xl border bg-card p-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                {position.description ? (
                    <p className="text-sm leading-relaxed">{position.description}</p>
                ) : (
                    <p className="text-sm italic text-muted-foreground">No description provided.</p>
                )}
            </div>
        </div>
    )
}
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrgUnitNode } from "@/types/org-unit.type"
import { OrgPositionsTable } from "./org-positions-table"
import { OrgLeadersTable } from "./org-leaders-table"
import { format } from "date-fns"
import { Building2, Pencil, Plus, Trash2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrgDetailsPanelProps {
    org: OrgUnitNode | null
    onEditAction?: (org: OrgUnitNode) => void
    onDeleteAction?: (org: OrgUnitNode) => void
    onRestoreAction?: (org: OrgUnitNode) => void
    onAddChildAction?: (org: OrgUnitNode) => void
}

function StatusBadge({ isDeleted, isActive }: { isDeleted: boolean; isActive: boolean }) {
    if (isDeleted) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Deleted
            </span>
        )
    }
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

export function OrgDetailsPanel({
    org,
    onEditAction,
    onDeleteAction,
    onRestoreAction,
    onAddChildAction,
}: OrgDetailsPanelProps) {
    if (!org) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium">No unit selected</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Select an organization unit from the tree to view its details.
                    </p>
                </div>
            </div>
        )
    }

    const isDeleted = !!org.deletedAt

    return (
        <div className="h-full overflow-y-auto space-y-5 pr-1">

            {/* ── Header card ── */}
            <div className={cn(
                'rounded-xl border p-5 space-y-4',
                isDeleted
                    ? 'bg-red-50/50 border-red-200'
                    : 'bg-gradient-to-br from-card to-muted/20 border-border shadow-sm',
            )}>
                {/* Icon + name + actions row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                            'mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
                            isDeleted ? 'bg-red-100' : 'bg-primary/10',
                        )}>
                            <Building2 className={cn(
                                'w-5 h-5',
                                isDeleted ? 'text-red-500' : 'text-primary',
                            )} />
                        </div>
                        <div className="min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold leading-tight">{org.name}</h2>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <code className="px-1.5 py-0.5 rounded-md bg-background text-xs font-mono text-muted-foreground border shadow-sm">
                                    {org.code}
                                </code>
                                <StatusBadge isDeleted={isDeleted} isActive={org.isActive} />
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                        {!isDeleted && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-xs"
                                    onClick={() => onEditAction?.(org)}
                                >
                                    <Pencil className="w-3 h-3" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-xs"
                                    onClick={() => onAddChildAction?.(org)}
                                >
                                    <Plus className="w-3 h-3" />
                                    Sub-Unit
                                </Button>
                                {org.isDeletable && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 gap-1.5 text-xs"
                                        onClick={() => onDeleteAction?.(org)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                    </Button>
                                )}
                            </>
                        )}
                        {isDeleted && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => onRestoreAction?.(org)}
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
                        <p className="text-xs font-medium">{format(new Date(org.createdAt), 'PP')}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last Updated</p>
                        <p className="text-xs font-medium">{format(new Date(org.updatedAt), 'PP')}</p>
                    </div>
                </div>

                {!isDeleted && !org.isDeletable && (
                    <p className="text-xs text-muted-foreground -mt-1">
                        ⓘ Cannot delete: unit has sub-units or linked employees.
                    </p>
                )}
            </div>

            {/* ── Leaders section ── */}
            {!isDeleted && (
                <>
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                        <OrgLeadersTable orgId={org.id} />
                    </div>
                    <Separator />
                </>
            )}

            {/* ── Positions section ── */}
            {!isDeleted && (
                <div className="rounded-xl border bg-card p-5 space-y-3">
                    <OrgPositionsTable orgId={org.id} />
                </div>
            )}
        </div>
    )
}

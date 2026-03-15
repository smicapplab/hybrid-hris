import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrgUnitNode } from "@/types/org-unit.type"
import { OrgPositionsTable } from "./org-positions-table"
import { OrgLeadersTable } from "./org-leaders-table"
import { OrgMembersTable } from "./org-members-table"
import { OrgPlantillaTable } from "./org-plantilla-table"
import { OrgPlantillaSummary } from "./org-plantilla-summary"
import { OrgManpowerRequestsTable } from "./org-manpower-requests-table"
import { format } from "date-fns"
import { Building2, Pencil, Plus, Trash2, RotateCcw, ListChecks, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MandatoryTrainingRequirementPanel } from '@/components/requirements/mandatory-training-requirement-panel'

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
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = () => setRefreshKey(prev => prev + 1);

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
        <div className="h-full flex flex-col gap-6 pr-1">

            {/* ── Header card ── */}
            <div className={cn(
                'rounded-xl border p-5 space-y-4 shrink-0',
                isDeleted
                    ? 'bg-red-50/50 border-red-200'
                    : 'bg-linear-to-br from-card to-muted/20 border-border shadow-sm',
            )}>
                {/* Icon + name + actions row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                            'mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
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
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
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

            {/* ── Content Tabs ── */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 max-w-100 bg-muted/50 p-1 rounded-lg shrink-0 border">
                    <TabsTrigger value="overview" className="gap-2 text-xs font-bold uppercase tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <ListChecks className="w-3.5 h-3.5" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="compliance" className="gap-2 text-xs font-bold uppercase tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <BookOpen className="w-3.5 h-3.5" /> Training Compliance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-5 flex-1 overflow-y-auto outline-hidden pb-8">
                    {/* ── Quick Summary ── */}
                    {!isDeleted && (
                        <OrgPlantillaSummary key={`summary-${refreshKey}`} orgId={org.id} />
                    )}

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
                <>
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                        <OrgPositionsTable orgId={org.id} />
                    </div>
                    <Separator />
                </>
            )}

            {/* ── Plantilla section ── */}
            {!isDeleted && (
                <>
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                        <OrgPlantillaTable org={org} />
                    </div>
                    <Separator />
                </>
            )}

            {/* ── Requests section ── */}
            {!isDeleted && (
                <>
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                        <OrgManpowerRequestsTable 
                            key={`requests-${refreshKey}`} 
                            orgId={org.id} 
                            onChangeAction={triggerRefresh}
                        />
                    </div>
                    <Separator />
                </>
            )}

            {/* ── Members section (leaf nodes only) ── */}
            {!isDeleted && !org.children?.length && (
                <div className="rounded-xl border bg-card p-5 space-y-3">
                    <OrgMembersTable orgId={org.id} />
                </div>
            )}
                </TabsContent>

                <TabsContent value="compliance" className="mt-4 flex-1 overflow-y-auto outline-hidden pb-8">
                    <MandatoryTrainingRequirementPanel targetId={org.id} type="org-unit" />
                </TabsContent>
            </Tabs>
        </div>
    )
}

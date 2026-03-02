'use client'

import { Sailboat, Plus, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { LeavePolicy } from '@/types/leave.types'

type Props = {
    policies: LeavePolicy[]
    loading: boolean
    search: string
    setSearchAction: (v: string) => void
    showInactive: boolean
    setShowInactiveAction: (v: boolean) => void
    selectedId: string | null
    onSelectAction: (id: string) => void
    onAddAction: () => void
}

export function PolicyListPanel({
    policies,
    loading,
    search,
    setSearchAction,
    showInactive,
    setShowInactiveAction,
    selectedId,
    onSelectAction,
    onAddAction,
}: Props) {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {loading ? '…' : `${policies.length} polic${policies.length !== 1 ? 'ies' : 'y'}`}
                </span>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={onAddAction}>
                    <Plus className="w-3 h-3" /> New
                </Button>
            </div>

            {/* Search */}
            <div className="px-3 pb-2 shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        className="pl-8 h-8 text-xs"
                        placeholder="Search name or code…"
                        value={search}
                        onChange={(e) => setSearchAction(e.target.value)}
                    />
                </div>
            </div>

            {/* Show inactive toggle */}
            <div className="px-4 pb-2 flex items-center gap-2 shrink-0">
                <Switch
                    id="show-inactive-policies"
                    checked={showInactive}
                    onCheckedChange={setShowInactiveAction}
                    className="scale-75"
                />
                <Label htmlFor="show-inactive-policies" className="text-xs text-muted-foreground cursor-pointer">
                    Show inactive
                </Label>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {policies.length === 0 && !loading && (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No policies found.
                    </div>
                )}

                {policies.map((policy) => {
                    const isSelected = selectedId === policy.id
                    const isInactive = !policy.isActive

                    return (
                        <button
                            key={policy.id}
                            onClick={() => onSelectAction(policy.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/40
                                ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'}
                                ${isInactive ? 'opacity-50' : ''}
                            `}
                        >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0
                                ${isSelected ? 'bg-primary/15 text-primary' : isInactive ? 'bg-muted text-muted-foreground' : 'bg-blue-50 text-blue-600'}`}
                            >
                                <Sailboat className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{policy.name}</p>
                                <p className="text-[11px] text-muted-foreground font-mono truncate">{policy.code}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                {policy.isDefault && (
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                                    ${policy.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                    {policy.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

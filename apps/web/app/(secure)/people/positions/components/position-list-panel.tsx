"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Position } from '@hybrid-hris/db/types'
import { useEffect, useState } from 'react'
import { Briefcase, Plus, Search } from 'lucide-react'

type PositionListPanelProps = {
    positions: Position[]
    loading: boolean
    search: string
    setSearchAction: (value: string) => void
    onSelectAction: (id: string) => void
    showInactive: boolean
    setShowInactiveAction: (value: boolean) => void
    selectedId: string | null
    onAddAction: () => void
}

export function PositionListPanel({
    positions,
    loading,
    search,
    setSearchAction,
    showInactive,
    setShowInactiveAction,
    selectedId,
    onSelectAction,
    onAddAction,
}: PositionListPanelProps) {
    const [localSearch, setLocalSearch] = useState(search)

    useEffect(() => {
        setLocalSearch(search)
    }, [search])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchAction(localSearch)
        }, 300)
        return () => clearTimeout(timeout)
    }, [localSearch, setSearchAction])

    return (
        <div className="h-full flex flex-col border-r">
            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold">Positions</h3>
                        <p className="text-xs text-muted-foreground">
                            {loading ? 'Loading…' : `${positions.length} position${positions.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onAddAction}>
                        <Plus className="w-3.5 h-3.5" />
                        New
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        className="pl-8 h-8 text-sm"
                        placeholder="Search positions…"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>

                {/* Show Inactive toggle */}
                <div className="flex items-center gap-2">
                    <Switch
                        checked={showInactive}
                        onCheckedChange={setShowInactiveAction}
                    />
                    <span className="text-xs text-muted-foreground">Show Inactive</span>
                </div>
            </div>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {loading && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Loading…
                    </div>
                )}

                {!loading && positions.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        No positions found.
                    </div>
                )}

                {!loading && positions.length > 0 && (
                    <div className="space-y-0.5">
                        {positions.map((position) => {
                            const isSelected = selectedId === position.id
                            return (
                                <button
                                    key={position.id}
                                    onClick={() => onSelectAction(position.id)}
                                    className={cn(
                                        "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                        isSelected
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted/60 text-foreground",
                                        !position.isActive && !isSelected && "opacity-60"
                                    )}
                                >
                                    <div className={cn(
                                        "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                                        isSelected ? "bg-primary/15" : "bg-muted",
                                    )}>
                                        <Briefcase className={cn(
                                            "w-3.5 h-3.5",
                                            isSelected ? "text-primary" : "text-muted-foreground"
                                        )} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate leading-tight">
                                            {position.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                                            {position.code}
                                        </p>
                                    </div>

                                    {!position.isActive && (
                                        <span className="text-[10px] border rounded-full px-1.5 py-px font-medium bg-zinc-100 text-zinc-500 border-zinc-200 shrink-0">
                                            Inactive
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

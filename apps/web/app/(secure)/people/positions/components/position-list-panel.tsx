"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Position } from '@hybrid-hris/db/types'
import { useEffect, useState } from 'react'

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
            <div className="p-4 space-y-4">
                <Input
                    placeholder="Search positions..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={showInactive}
                            onCheckedChange={(value: boolean) => setShowInactiveAction(value)}
                        />
                        <span className="text-sm text-muted-foreground">
                            Show Inactive
                        </span>
                    </div>

                    <Button size="sm" onClick={() => onAddAction()}>
                        + Add
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {loading && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                        Loading...
                    </div>
                )}

                {!loading && positions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                        No positions found.
                    </div>
                )}

                <div className="space-y-1">
                    {positions.map((position) => (
                        <div
                            key={position.id}
                            onClick={() => onSelectAction(position.id)}
                            className={cn(
                                "px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
                                selectedId === position.id
                                    ? position.isActive
                                        ? "bg-muted border border-primary"
                                        : "bg-red-50 border border-red-500"
                                    : position.isActive
                                        ? "hover:bg-muted/50 border-transparent"
                                        : "bg-red-50/70 hover:bg-red-50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="font-medium truncate">
                                    {position.title}
                                </div>
                                {!position.isActive && (
                                    <span className="text-xs text-red-500">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                {position.code}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
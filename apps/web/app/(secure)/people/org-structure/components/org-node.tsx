import type { Dispatch, SetStateAction } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, Building2, Dot } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgUnitNode } from "@/types/org-unit.type"

interface OrgNodeProps {
    node: OrgUnitNode
    depth: number
    selectedId?: string
    openNodes: Record<string, boolean>
    setOpenNodes: Dispatch<SetStateAction<Record<string, boolean>>>
    onSelectAction: (node: OrgUnitNode) => void
}

export function OrgNode({
    node,
    depth,
    selectedId,
    openNodes,
    setOpenNodes,
    onSelectAction,
}: OrgNodeProps) {
    const open = openNodes[node.id] ?? false

    const toggle = (value: boolean) => {
        setOpenNodes((prev) => ({ ...prev, [node.id]: value }))
    }

    const children = node.children ?? []
    const hasChildren = children.length > 0
    const isSelected = selectedId === node.id
    const isDeleted = !!node.deletedAt

    return (
        <Collapsible open={open} onOpenChange={toggle}>
            <div
                className={cn(
                    "group flex items-center gap-1.5 py-1.5 px-2 mx-1 rounded-md cursor-pointer transition-all text-sm select-none",
                    isSelected
                        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary pl-1.5"
                        : "hover:bg-muted/60 border-l-2 border-transparent pl-1.5",
                    isDeleted && "opacity-60",
                )}
                style={{ paddingLeft: `${depth * 14 + 6}px` }}
                onClick={() => onSelectAction(node)}
            >
                {/* Expand/collapse toggle */}
                {hasChildren ? (
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center flex-shrink-0 rounded hover:bg-muted p-0.5 -ml-0.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ChevronRight
                                className={cn(
                                    "h-3.5 w-3.5 transition-transform text-muted-foreground",
                                    open && "rotate-90",
                                )}
                            />
                        </button>
                    </CollapsibleTrigger>
                ) : (
                    <Dot className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
                )}

                {/* Unit icon */}
                <Building2 className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground",
                )} />

                {/* Unit name + code */}
                <div className="flex flex-col min-w-0 leading-tight">
                    <span className={cn(
                        "truncate text-[13px]",
                        isDeleted && "line-through text-muted-foreground",
                    )}>
                        {node.name}
                    </span>
                    <span className={cn(
                        "text-[10px] font-mono truncate",
                        isSelected ? "text-primary/70" : "text-muted-foreground/60",
                    )}>
                        {node.code}
                    </span>
                </div>
            </div>

            {hasChildren && (
                <CollapsibleContent>
                    {children.map((child) => (
                        <OrgNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            openNodes={openNodes}
                            setOpenNodes={setOpenNodes}
                            onSelectAction={onSelectAction}
                        />
                    ))}
                </CollapsibleContent>
            )}
        </Collapsible>
    )
}

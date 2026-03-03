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
                    "group flex items-center gap-1.5 py-1.5 px-2 rounded- cursor-pointer transition-all text-sm select-none",
                    isSelected
                        ? "bg-primary/10 text-primary font-medium"
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
                            className="flex items-center rounded hover:bg-muted p-0.5 -ml-0.5"
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
                    <Dot className="h-3.5 w-3.5  text-muted-foreground/50" />
                )}

                {/* Unit icon */}
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0
                                ${isSelected ? 'bg-primary/15 text-primary' : 'bg-blue-50 text-blue-600'}`}
                >
                    <Building2 className={cn(
                        "h-3.5 w-3.5 ",
                        isSelected ? "text-primary" : "text-muted-foreground",
                    )} />
                </div>

                {/* Unit name + code */}
                <div className="flex flex-col min-w-0 leading-tight">
                    <span className={cn(
                        "text-sm font-medium truncate",
                        isDeleted && "line-through text-muted-foreground",
                    )}>
                        {node.name}
                    </span>
                    <span className={cn(
                        "text-[11px] text-muted-foreground font-mono truncate",
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

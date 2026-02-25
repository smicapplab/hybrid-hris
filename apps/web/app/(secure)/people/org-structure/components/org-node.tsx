import type { Dispatch, SetStateAction } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
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
        setOpenNodes((prev) => ({
            ...prev,
            [node.id]: value,
        }))
    }

    const children = node.children ?? []
    const hasChildren = children.length > 0
    const isSelected = selectedId === node.id
    const isDeleted = !!node.deletedAt

    return (
        <Collapsible open={open} onOpenChange={toggle}>
            <div
                className={cn(
                    "flex items-center gap-2 py-2 rounded-md px-2 cursor-pointer transition-colors",
                    isSelected && "bg-muted",
                    isDeleted && "bg-red-50"
                )}
                style={{ paddingLeft: depth * 16 }}
                onClick={() => onSelectAction(node)}
            >
                {hasChildren && (
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ChevronRight
                                className={cn(
                                    "h-4 w-4 transition-transform",
                                    open && "rotate-90"
                                )}
                            />
                        </button>
                    </CollapsibleTrigger>
                )}

                <span className={cn(isDeleted && "text-red-600")}>{node.name}</span>
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
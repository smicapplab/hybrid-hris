import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import type { OrgUnit } from '@hybrid-hris/db/types'

interface OrgUnitNode extends OrgUnit {
    children?: OrgUnitNode[]
}

export function OrgNode({
    node,
    depth,
}: {
    node: OrgUnitNode
    depth: number
}) {
    const children = node.children ?? []
    const hasChildren = children.length > 0

    return (
        <Collapsible>
            <CollapsibleTrigger
                className="flex items-center gap-2 py-1 hover:bg-muted rounded-md px-2"
                style={{ paddingLeft: depth * 16 }}
            >
                {hasChildren && <ChevronRight className="h-4 w-4" />}
                <span>{node.name}</span>
            </CollapsibleTrigger>

            {hasChildren && (
                <CollapsibleContent>
                    {children.map(child => (
                        <OrgNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                        />
                    ))}
                </CollapsibleContent>
            )}
        </Collapsible>
    )
}
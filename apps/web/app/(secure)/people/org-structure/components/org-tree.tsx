import { OrgUnitNode } from "@/types/org-unit.type"
import { OrgNode } from "./org-node"
interface OrgTreeProps {
    data: OrgUnitNode[]
    selectedId?: string
    openNodes: Record<string, boolean>
    setOpenNodes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    onSelectAction: (node: OrgUnitNode) => void
}

export function OrgTree({
    data,
    selectedId,
    openNodes,
    setOpenNodes,
    onSelectAction,
}: OrgTreeProps) {
    return (
        <div className="space-y-1 text-sm">
            {data.map((node) => (
                <OrgNode
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={selectedId}
                    openNodes={openNodes}
                    setOpenNodes={setOpenNodes}
                    onSelectAction={onSelectAction}
                />
            ))}
        </div>
    )
}
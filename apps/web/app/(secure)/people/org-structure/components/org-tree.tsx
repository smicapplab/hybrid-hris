import { OrgNode } from "./org-node"
import type { OrgUnit } from '@hybrid-hris/db/types'

interface OrgUnitNode extends OrgUnit {
    children?: OrgUnitNode[]
}

export function OrgTree({ data }: { data: OrgUnitNode[] }) {
    return (
        <div className="space-y-1">
            {data.map(node => (
                <OrgNode key={node.id} node={node} depth={0} />
            ))}
        </div>
    )
}
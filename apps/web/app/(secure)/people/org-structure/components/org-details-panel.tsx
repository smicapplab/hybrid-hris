import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrgUnitNode } from "@/types/org-unit.type"

interface OrgDetailsPanelProps {
    org: OrgUnitNode | null
    onEditAction?: (org: OrgUnitNode) => void
    onDeleteAction?: (org: OrgUnitNode) => void
    onRestoreAction?: (org: OrgUnitNode) => void
    onAddChildAction?: (org: OrgUnitNode) => void
}

export function OrgDetailsPanel({
    org,
    onEditAction,
    onDeleteAction,
    onRestoreAction,
    onAddChildAction,
}: OrgDetailsPanelProps) {
    if (!org) {
        return (
            <div className="text-muted-foreground">
                Select an organization unit to view details.
            </div>
        )
    }

    const isDeleted = !!org.deletedAt

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold">{org.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        Code: {org.code}
                    </p>
                </div>

                <div className="flex gap-2">
                    {!isDeleted && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onEditAction?.(org)}
                            >
                                Edit
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => onAddChildAction?.(org)}
                            >
                                Add Sub-Unit
                            </Button>

                            {org.isDeletable && <Button
                                variant="destructive"
                                onClick={() => onDeleteAction?.(org)}
                            >
                                Delete
                            </Button>
                            }
                        </>
                    )}

                    {isDeleted && (
                        <Button
                            variant="outline"
                            onClick={() => onRestoreAction?.(org)}
                        >
                            Restore
                        </Button>
                    )}
                </div>
            </div>
            {!isDeleted && !org.isDeletable && (
                <p className="text-xs text-muted-foreground mt-2 text-right">
                    Cannot delete: unit has children or linked records.
                </p>
            )}
            <Separator />

            {/* Meta Info */}
            <div className="text-sm space-y-2">
                <div>
                    <span className="font-medium">Parent ID:</span>{" "}
                    {org.parentId ?? "—"}
                </div>

                <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(org.createdAt).toLocaleString()}
                </div>

                <div>
                    <span className="font-medium">Updated:</span>{" "}
                    {new Date(org.updatedAt).toLocaleString()}
                </div>

                <div>
                    <span className="font-medium">Status:</span>{" "}
                    {isDeleted
                        ? "Deleted"
                        : org.isActive
                            ? "Active"
                            : "Inactive"}
                </div>
            </div>
        </div>
    )
}
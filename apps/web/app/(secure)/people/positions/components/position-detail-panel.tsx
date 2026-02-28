'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Position } from '@/types/position.types'
import { format } from 'date-fns'

type Props = {
    position: Position
    onEditAction: () => void
    onDeleteAction: () => void
    onRestoreAction: () => void
}

export function PositionDetailPanel({
    position,
    onEditAction,
    onDeleteAction,
    onRestoreAction,
}: Props) {
    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold">
                        {position.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Code: {position.code}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button size="sm" onClick={() => onEditAction()}>
                        Edit
                    </Button>

                    {position.isActive ? (
                        position.isDeletable && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDeleteAction()}
                            >
                                Delete
                            </Button>
                        )
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRestoreAction()}
                        >
                            Restore
                        </Button>
                    )}
                </div>
            </div>
            {position.isActive && !position.isDeletable && (
                <p className="text-xs text-muted-foreground mt-2 text-right">
                    This position cannot be deleted because it is assigned to one or more employees.
                </p>
            )}

            <Separator className="my-6" />

            <div className="space-y-4 text-sm">
                <div>
                    <p className="text-muted-foreground">Description</p>
                    <p>
                        {position.description || (
                            <span className="italic text-muted-foreground">
                                No description provided.
                            </span>
                        )}
                    </p>
                </div>

                <div>
                    <p className="text-muted-foreground">Status</p>
                    <p>
                        {position.isActive ? 'Active' : 'Inactive'}
                    </p>
                </div>

                <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{format(new Date(position.createdAt), 'PP')}</p>
                </div>

                <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{format(new Date(position.updatedAt), 'PP')}</p>
                </div>
            </div>
        </div>
    )
}
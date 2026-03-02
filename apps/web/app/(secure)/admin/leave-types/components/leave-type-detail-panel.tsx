'use client'

import { CalendarDays, Pencil, Trash2, RotateCcw, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LeaveType } from '@/types/leave.types'

type Props = {
    leaveType: LeaveType
    onEditAction: () => void
    onDeleteAction: () => void
    onRestoreAction: () => void
}

function StatusBadge({ deleted }: { deleted: boolean }) {
    return deleted ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500">
            Archived
        </span>
    ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
            Active
        </span>
    )
}

function Pill({ label, active, activeClass, inactiveClass }: {
    label: string
    active: boolean
    activeClass: string
    inactiveClass: string
}) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${active ? activeClass : inactiveClass}`}>
            {label}
        </span>
    )
}

export function LeaveTypeDetailPanel({ leaveType, onEditAction, onDeleteAction, onRestoreAction }: Props) {
    const isDeleted = !!leaveType.deletedAt

    return (
        <div className="space-y-4">
            {/* Header card */}
            <div className={`rounded-xl border p-5 bg-gradient-to-br ${isDeleted ? 'from-zinc-50 to-zinc-100/60' : 'from-card to-muted/20'}`}>
                <div className="flex items-start gap-4">
                    {/* Icon box */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                        ${isDeleted ? 'bg-zinc-200 text-zinc-400' : 'bg-emerald-100 text-emerald-700'}`}
                    >
                        <CalendarDays className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className={`text-lg font-semibold ${isDeleted ? 'line-through text-muted-foreground' : ''}`}>
                                {leaveType.name}
                            </h2>
                            <StatusBadge deleted={isDeleted} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <code className="text-xs bg-muted border rounded px-1.5 py-0.5 shadow-sm font-mono">
                                {leaveType.code}
                            </code>
                            <Pill
                                label={leaveType.isPaid ? 'Paid' : 'Unpaid'}
                                active={leaveType.isPaid}
                                activeClass="bg-blue-50 text-blue-600"
                                inactiveClass="bg-zinc-100 text-zinc-500"
                            />
                            <Pill
                                label={leaveType.isAccrualBased ? 'Accrual-based' : 'Manual'}
                                active={leaveType.isAccrualBased}
                                activeClass="bg-violet-50 text-violet-600"
                                inactiveClass="bg-zinc-100 text-zinc-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={onEditAction}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    {isDeleted ? (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={onRestoreAction}>
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={onDeleteAction}>
                            <Trash2 className="w-3.5 h-3.5" /> Archive
                        </Button>
                    )}
                </div>
            </div>

            {/* Accrual details */}
            {leaveType.isAccrualBased && (
                <div className="rounded-xl border p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Accrual Defaults
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Monthly Rate</span>
                            </div>
                            <p className="text-sm font-semibold">
                                {leaveType.accrualRatePerMonth
                                    ? `${parseFloat(leaveType.accrualRatePerMonth)} days`
                                    : <span className="text-muted-foreground font-normal text-xs">Not set</span>
                                }
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Max Carry-Over</span>
                            </div>
                            <p className="text-sm font-semibold">
                                {leaveType.maxCarryOver
                                    ? `${parseFloat(leaveType.maxCarryOver)} days`
                                    : <span className="text-muted-foreground font-normal text-xs">Unlimited</span>
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            {leaveType.description && (
                <div className="rounded-xl border p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Description
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {leaveType.description}
                    </p>
                </div>
            )}

            {/* Meta strip */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-0.5">Created</p>
                    <p className="text-xs">{new Date(leaveType.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-0.5">Last Updated</p>
                    <p className="text-xs">{new Date(leaveType.updatedAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    )
}

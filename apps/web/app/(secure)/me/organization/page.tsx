'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Briefcase, ChevronRight, User, Users, Crown, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgContext } from '@/types/org.type'
import { ORG_LEADER_ROLE_BADGE, ORG_LEADER_ROLE_LABEL } from '@/lib/org.enum'
import { EMPLOYEE_STATUS_BADGE, EMPLOYMENT_TYPE_LABELS } from '@/lib/employee.enum'

/* ─── Avatar helper ─────────────────────────────────────────── */
function Avatar({ name, className }: { name: string; className?: string }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    return (
        <div className={cn(
            'rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs',
            className,
        )}>
            {initials}
        </div>
    )
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function OrganizationPage() {
    const { user } = useAuth()
    const [ctx, setCtx] = useState<OrgContext | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        apiFetch<OrgContext>('/profile/me/organization')
            .then(setCtx)
            .catch(err => setError(err?.message ?? 'Failed to load organization data'))
            .finally(() => setLoading(false))
    }, [user])

    if (!user) return null

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                Loading organization context…
            </div>
        )
    }

    if (error || !ctx) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-destructive">
                {error ?? 'No organization data found.'}
            </div>
        )
    }

    const fullName = `${ctx.employee.firstName} ${ctx.employee.lastName}`

    return (
        <div className="p-6 space-y-4 max-w-4xl">
            {/* ── My Position Card ─────────────────────────────────── */}
            <Card className="overflow-hidden">
                <div className="px-6 pt-6 pb-5">
                    <div className="flex items-start gap-4">
                        <Avatar name={fullName} className="w-14 h-14 text-base" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                You
                            </p>
                            <h2 className="text-lg font-bold leading-tight">{fullName}</h2>
                            {ctx.position && (
                                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    {ctx.position.title}
                                    <code className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                                        {ctx.position.code}
                                    </code>
                                </p>
                            )}
                        </div>
                        <span className={cn(
                            'text-xs border rounded-full px-2.5 py-0.5 font-medium',
                            EMPLOYEE_STATUS_BADGE[ctx.employee.status] ?? 'bg-muted text-muted-foreground',
                        )}>
                            {ctx.employee.status}
                        </span>
                    </div>
                </div>

                {ctx.orgUnit && (
                    <CardContent className="pt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Department
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {ctx.orgUnit.path.map((segment, i) => (
                                <span key={i} className="flex items-center gap-1.5 text-sm">
                                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                    <span className={cn(
                                        i === ctx.orgUnit!.path.length - 1
                                            ? 'font-semibold text-foreground'
                                            : 'text-muted-foreground'
                                    )}>
                                        {segment}
                                    </span>
                                </span>
                            ))}
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                {ctx.orgUnit.code}
                            </code>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* ── Supervisor + Direct Reports ───────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                            Reports To
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ctx.supervisor ? (
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={`${ctx.supervisor.firstName} ${ctx.supervisor.lastName}`}
                                    className="w-9 h-9"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-tight truncate">
                                        {ctx.supervisor.firstName} {ctx.supervisor.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {ctx.supervisor.positionTitle}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No supervisor assigned</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            Direct Reports
                            {ctx.directReports.length > 0 && (
                                <span className="ml-auto text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
                                    {ctx.directReports.length}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ctx.directReports.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No direct reports</p>
                        ) : (
                            <div className="space-y-2.5">
                                {ctx.directReports.slice(0, 5).map(dr => (
                                    <div key={dr.id} className="flex items-center gap-2.5">
                                        <Avatar name={`${dr.firstName} ${dr.lastName}`} className="w-7 h-7" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium leading-tight truncate">
                                                {dr.firstName} {dr.lastName}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {dr.positionTitle}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {ctx.directReports.length > 5 && (
                                    <p className="text-xs text-muted-foreground pt-1">
                                        +{ctx.directReports.length - 5} more
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Unit Leaders ──────────────────────────────────────── */}
            {ctx.leaders.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Crown className="w-4 h-4 text-muted-foreground" />
                            Unit Leadership
                            {ctx.orgUnit && (
                                <span className="text-xs text-muted-foreground font-normal">
                                    — {ctx.orgUnit.name}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {ctx.leaders.map(leader => (
                                <div key={leader.id} className="flex items-center gap-3">
                                    <Avatar
                                        name={`${leader.firstName} ${leader.lastName}`}
                                        className="w-8 h-8"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium leading-tight">
                                                {leader.firstName} {leader.lastName}
                                            </p>
                                            {leader.isPrimary && (
                                                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-px font-medium">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={cn(
                                        'text-[11px] border rounded-full px-2 py-0.5 font-medium',
                                        ORG_LEADER_ROLE_BADGE[leader.role] ?? 'bg-muted text-muted-foreground',
                                    )}>
                                        {ORG_LEADER_ROLE_LABEL[leader.role] ?? leader.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Employment Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Employee No.</dt>
                            <dd className="mt-0.5 font-mono font-medium">{ctx.employee.employeeNo}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Hire Date</dt>
                            <dd className="mt-0.5">
                                {new Date(ctx.employee.hireDate).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Employment Type</dt>
                            <dd className="mt-0.5">
                                {EMPLOYMENT_TYPE_LABELS[ctx.employee.employmentType] ?? ctx.employee.employmentType}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Status</dt>
                            <dd className="mt-0.5">
                                <span className={cn(
                                    'text-xs border rounded-full px-2 py-0.5 font-medium',
                                    EMPLOYEE_STATUS_BADGE[ctx.employee.status] ?? 'bg-muted text-muted-foreground',
                                )}>
                                    {ctx.employee.status}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
    )
}

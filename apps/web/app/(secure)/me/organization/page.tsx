'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Briefcase, ChevronRight, User, Users, ArrowUpRight, ShieldCheck, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgContext } from '@/types/org.type'
import { ORG_LEADER_ROLE_BADGE, ORG_LEADER_ROLE_LABEL } from '@/lib/org.enum'
import { EMPLOYEE_STATUS_BADGE, EMPLOYMENT_TYPE_LABELS } from '@/lib/employee.enum'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SkillApprovalsTab } from './components/skill-approvals-tab'
import { TeamComplianceTab } from './components/team-compliance-tab'
import { EmployeeTalentCard } from './components/employee-talent-card'
import { Badge } from '@/components/ui/badge'

/* ─── Avatar helper ─────────────────────────────────────────── */
function Avatar({ name, className }: { name: string; className?: string }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    return (
        <div className={cn(
            'rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs shrink-0',
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

    // NEW: Drill-down state
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('my-org')

    const handleSelectFromCompliance = (id: string) => {
        setSelectedEmployeeId(id)
        setActiveTab('my-team')
    }

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
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground animate-pulse font-medium">
                Loading organization context…
            </div>
        )
    }

    if (error || !ctx) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-destructive font-medium">
                {error ?? 'No organization data found.'}
            </div>
        )
    }

    const fullName = `${ctx.employee.firstName} ${ctx.employee.lastName}`
    const canSeeApprovals = user.roles.some(r => ['ADMIN', 'HR_ADMIN', 'SUPERVISOR', 'MANAGER'].includes(r))

    return (
        <div className="p-6 space-y-6 max-w-5xl text-foreground">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-162.5 h-10 p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="my-org" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
                        <Building2 className="w-4 h-4" /> My Organization
                    </TabsTrigger>
                    <TabsTrigger value="my-team" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
                        <Users className="w-4 h-4" /> My Team
                    </TabsTrigger>
                    <TabsTrigger value="compliance" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
                        <ShieldCheck className="w-4 h-4" /> Team Compliance
                    </TabsTrigger>
                    {canSeeApprovals && (
                        <TabsTrigger value="approvals" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
                            <GraduationCap className="w-4 h-4" /> Skill Approvals
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="my-org" className="mt-6 space-y-6">
                    {/* ── My Position Card ─────────────────────────────────── */}
                    <Card className="overflow-hidden shadow-sm border-border/60 bg-card">
                        <div className="px-6 pt-6 pb-5">
                            <div className="flex items-start gap-4">
                                <Avatar name={fullName} className="w-14 h-14 text-base" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-0.5 leading-none">
                                        You
                                    </p>
                                    <h2 className="text-xl font-bold leading-tight">{fullName}</h2>
                                    {ctx.position && (
                                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {ctx.position.title}
                                            <code className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono font-bold">
                                                {ctx.position.code}
                                            </code>
                                        </p>
                                    )}
                                </div>
                                <span className={cn(
                                    'text-xs border rounded-full px-3 py-0.5 font-bold uppercase tracking-tight',
                                    EMPLOYEE_STATUS_BADGE[ctx.employee.status] ?? 'bg-muted text-muted-foreground',
                                )}>
                                    {ctx.employee.status}
                                </span>
                            </div>
                        </div>

                        {ctx.orgUnit && (
                            <CardContent className="pt-4 border-t border-border/40 bg-muted/5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 leading-none">
                                    Department Path
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    {ctx.orgUnit.path.map((segment, i) => (
                                        <span key={i} className="flex items-center gap-1.5 text-sm">
                                            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
                                            <span className={cn(
                                                i === ctx.orgUnit!.path.length - 1
                                                    ? 'font-bold text-foreground'
                                                    : 'text-muted-foreground font-medium'
                                            )}>
                                                {segment}
                                            </span>
                                        </span>
                                    ))}
                                    <Badge variant="secondary" className="text-[10px] font-mono h-5">
                                        {ctx.orgUnit.code}
                                    </Badge>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm border-border/60 bg-card">
                            <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground leading-none">
                                    <ArrowUpRight className="w-4 h-4 text-orange-500" />
                                    Reports To
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5">
                                {ctx.supervisor ? (
                                    <div className="flex items-center gap-4">
                                        <Avatar
                                            name={`${ctx.supervisor.firstName} ${ctx.supervisor.lastName}`}
                                            className="w-10 h-10 border"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold leading-tight truncate text-foreground">
                                                {ctx.supervisor.firstName} {ctx.supervisor.lastName}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-medium truncate mt-1 uppercase tracking-tight">
                                                {ctx.supervisor.positionTitle}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">No supervisor assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-border/60 bg-card">
                            <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground leading-none">
                                    <User className="w-4 h-4 text-blue-500" />
                                    Employment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">Type</span>
                                        <span className="font-bold text-foreground">{EMPLOYMENT_TYPE_LABELS[ctx.employee.employmentType] ?? ctx.employee.employmentType}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">Joined</span>
                                        <span className="font-bold text-foreground">{new Date(ctx.employee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="my-team" className="mt-6 space-y-6 text-foreground">
                    {selectedEmployeeId ? (
                        <EmployeeTalentCard
                            employeeId={selectedEmployeeId}
                            onBackAction={() => setSelectedEmployeeId(null)}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {/* ── Direct Reports Section ── */}
                            {ctx.directReports.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">My Direct Reports ({ctx.directReports.length})</h3>
                                        <span className="text-[10px] text-muted-foreground italic font-medium">Click card to view details</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {ctx.directReports.map(dr => (
                                            <Card key={dr.id} className="hover:border-primary/50 transition-all bg-card border-border/60 shadow-none cursor-pointer group" onClick={() => setSelectedEmployeeId(dr.id)}>
                                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Avatar name={`${dr.firstName} ${dr.lastName}`} className="w-9 h-9 border group-hover:border-primary/30 transition-colors" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold leading-tight truncate text-foreground group-hover:text-primary transition-colors">{dr.firstName} {dr.lastName}</p>
                                                            <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5 uppercase tracking-tight">{dr.positionTitle}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ── Peers Section ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 leading-none">My Peers in {ctx.orgUnit?.name} ({ctx.peers?.length ?? 0})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {ctx.peers?.map(peer => {
                                        const isSupervisor = ctx.supervisor?.id === peer.id;
                                        const isLead = ctx.leaders.some(l => l.employeeId === peer.id);

                                        return (
                                            <Card key={peer.id} className={cn(
                                                "transition-all bg-card border-border/60 shadow-none",
                                                (isSupervisor || isLead) && "border-blue-200 bg-blue-50/10 ring-1 ring-blue-100/50"
                                            )}>
                                                <CardContent className="p-4 flex items-center gap-3 relative text-foreground">
                                                    <Avatar name={`${peer.firstName} ${peer.lastName}`} className="w-9 h-9" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold leading-tight truncate">{peer.firstName} {peer.lastName}</p>
                                                            {isSupervisor && <Badge className="text-[8px] h-3.5 px-1 bg-orange-100 text-orange-700 border-orange-200 shadow-none">Manager</Badge>}
                                                            {isLead && <Badge className="text-[8px] h-3.5 px-1 bg-blue-100 text-blue-700 border-blue-200 shadow-none">Lead</Badge>}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5 uppercase tracking-tight">{peer.positionTitle}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                    {(!ctx.peers || ctx.peers.length === 0) && (
                                        <div className="col-span-full py-12 text-center border-dashed border rounded-2xl bg-muted/5">
                                            <p className="text-xs text-muted-foreground italic font-medium">No other members in this unit yet.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ── Unit Leadership Matrix ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 leading-none">Unit Leadership Matrix</h3>
                                <Card className="border-border/60 shadow-none overflow-hidden bg-card">
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border/40">
                                            {ctx.leaders.map(leader => (
                                                <div key={leader.id} className="flex items-center justify-between p-4 bg-card hover:bg-muted/5 transition-colors text-foreground">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={`${leader.firstName} ${leader.lastName}`} className="w-8 h-8" />
                                                        <div>
                                                            <p className="text-sm font-bold">{leader.firstName} {leader.lastName}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[9px] uppercase h-4 px-1.5",
                                                                    ORG_LEADER_ROLE_BADGE[leader.role]
                                                                )}>
                                                                    {ORG_LEADER_ROLE_LABEL[leader.role]}
                                                                </Badge>
                                                                {leader.isPrimary && <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Primary Contact</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="compliance" className="mt-6">
                    <div className="space-y-4">
                        <div className="px-1">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Team Compliance Tracking</h3>
                            <p className="text-xs text-muted-foreground mt-1">Monitor completion status of mandatory training across your team.</p>
                        </div>
                        <TeamComplianceTab onSelectEmployeeAction={handleSelectFromCompliance} />
                    </div>
                </TabsContent>

                {canSeeApprovals && (
                    <TabsContent value="approvals" className="mt-6">
                        <div className="space-y-4">
                            <div className="px-1">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Skill Verification</h3>
                                <p className="text-xs text-muted-foreground mt-1">Review and approve skill declarations from your direct reports.</p>
                            </div>
                            <SkillApprovalsTab />
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}

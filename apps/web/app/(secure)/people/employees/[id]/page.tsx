'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type {
    Employee,
    SupervisorOption,
} from '@/types/employee.type'
import type { OrgUnitOption } from '@/types/org-unit.type'
import type { PositionOption } from '@/types/position.types'
import type { LeavePolicy } from '@/types/leave.types'
import type { Role } from '@/lib/auth-types'
import type { ShiftAssignment, AttendanceLog, PendingChangeItem, EmployeeCompensation, PayrollComponent } from '@/types/attendance.types'
import {
    isEmployeeStatus,
} from '@hybrid-hris/domain'
import { getBackgroundColor } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from "@/hooks/use-toast";
import { STATUS_CONFIG, EMPLOYMENT_TYPE_LABELS } from '@/lib/employee.enum'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, ArrowRight, User as UserIcon, Wallet, FileText } from 'lucide-react'
import { ChangeScheduleDialog } from '../components/change-schedule-dialog'
import { WorkTab } from './components/tabs/WorkTab'
import { PersonalTab } from './components/tabs/PersonalTab'
import { AttendanceTab } from './components/tabs/AttendanceTab'
import { CompensationTab } from './components/tabs/CompensationTab'
import { PayrollHistoryTab } from './components/tabs/PayrollHistoryTab'
import { FinalPayTab } from './components/tabs/FinalPayTab'
import { CompensationChangeDialog } from './components/compensation-change-dialog'
import type { CompensationTemplate } from '@/types/compensation.types'
import { removeUndefined, normalizeEmail } from '@/lib/helpers'
import { stripSystemFields } from '../helpers'
import { cleanPhoneNumber } from '@/components/ui/phone-input'
import { cleanLandline } from '@/components/ui/landline-input'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'

interface JobLevel {
    id: string;
    code: string;
    name: string;
}

// Helper to format days of week for any shift-like object
const getShiftDays = (s: ShiftAssignment | PendingChangeItem) => {
    const days = [];
    if (s.isMon) days.push('Mon');
    if (s.isTue) days.push('Tue');
    if (s.isWed) days.push('Wed');
    if (s.isThu) days.push('Thu');
    if (s.isFri) days.push('Fri');
    if (s.isSat) days.push('Sat');
    if (s.isSun) days.push('Sun');
    return days.join(', ');
}

export default function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { toast } = useToast();
    const { user: currentUser } = useAuth()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [originalStatus, setOriginalStatus] = useState<string | null>(null)
    const [originalJobLevelId, setOriginalJobLevelId] = useState<string | null>(null)
    const [positions, setPositions] = useState<PositionOption[]>([])
    const [jobLevels, setJobLevels] = useState<JobLevel[]>([])
    const [policies, setPolicies] = useState<LeavePolicy[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [compensations, setCompensations] = useState<EmployeeCompensation[]>([])
    const [payrollComponents, setPayrollComponents] = useState<PayrollComponent[]>([]);
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitOption | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [statusSaving, setStatusSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [activeTab, setActiveTab] = useState('work')
    const [pendingShifts, setPendingShifts] = useState<PendingChangeItem[]>([])
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
    const [isChangeScheduleOpen, setIsChangeScheduleOpen] = useState(false)
    const [isCompDialogOpen, setIsCompDialogOpen] = useState(false)
    const [nextTemplate, setNextTemplate] = useState<any>(null)

    const fetchOrgUnits = useCallback(async (search: string) => {
        try {
            const list = await apiFetch<OrgUnitOption[]>(
                `/org-units/search?leavesOnly=true&showDeleted=false&limit=20&query=${encodeURIComponent(search)}`,
            )
            if (currentOrgUnit && !list.some((ou) => ou.id === currentOrgUnit.id)) {
                return [currentOrgUnit, ...list]
            }
            return list
        } catch (err) {
            console.error('Failed to fetch org units:', err)
            return []
        }
    }, [currentOrgUnit])

    const fetchSupervisors = useCallback(async (search: string) => {
        try {
            const res = await apiFetch<{ data: SupervisorOption[] }>(
                `/employees?status=ACTIVE&search=${encodeURIComponent(search)}&pageSize=20`,
            )
            return res.data
        } catch (err) {
            console.error('Failed to fetch supervisors:', err)
            return []
        }
    }, [])

    const fetchAncillaryData = useCallback(async () => {
        try {
            const [shift, pending, logs, comps, payComps] = await Promise.all([
                apiFetch<ShiftAssignment>(`/shift-assignments?employeeId=${id}`).catch(() => null),
                apiFetch<PendingChangeItem[]>(`/pending-shift-assignments?employeeId=${id}&status=PENDING`).catch(() => []),
                apiFetch<AttendanceLog[]>(`/attendance?employeeId=${id}`).catch(() => []),
                apiFetch<EmployeeCompensation[]>(`/employee-compensations?employeeId=${id}`).catch(() => []),
                apiFetch<PayrollComponent[]>('/payroll-components').catch(() => []),
            ])
            setEmployee(prev => prev ? { ...prev, shiftAssignment: shift } : prev)
            setPendingShifts(pending)
            setAttendanceLogs(logs)
            setCompensations(comps)
            setPayrollComponents(payComps)
        } catch (err) {
            console.error('Failed to fetch ancillary data:', err)
        }
    }, [id])

    useEffect(() => {
        async function fetchEmployee() {
            try {
                const data = await apiFetch<Employee>(`/employees/${id}`)
                setEmployee(data)
                setOriginalStatus(data.status)
                setOriginalJobLevelId(data.jobLevelId)

                const [orgUnit, positionsData, jobLevelsData, policiesData, rolesData] = await Promise.all([
                    apiFetch<OrgUnitOption>(`/org-units/${data.orgUnitId}`),
                    apiFetch<PositionOption[]>(`/org-units/${data.orgUnitId}/positions`),
                    apiFetch<JobLevel[]>('/job-levels'),
                    apiFetch<LeavePolicy[]>('/leave-policies?active=true'),
                    apiFetch<Role[]>('/roles'),
                ])

                setCurrentOrgUnit(orgUnit)
                setPositions(positionsData)
                setJobLevels(jobLevelsData)
                setPolicies(policiesData)
                setRoles(rolesData)

                if (positionsData.length > 0 && !positionsData.some((p) => p.id === data.positionId)) {
                    setEmployee((prev) => prev ? { ...prev, positionId: positionsData[0]!.id } : prev)
                }

                await fetchAncillaryData()
            } catch (err) {
                console.error('Failed to fetch employee details:', err)
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchEmployee()
    }, [id, fetchAncillaryData])

    async function handleStatusChange(value: string) {
        if (!employee || value === employee.status || !isEmployeeStatus(value)) return

        setStatusSaving(true)
        try {
            setEmployee((prev) => prev ? { ...prev, status: value } : prev)
            await apiFetch(`/employees/${id}/status`, {
                method: 'POST',
                body: JSON.stringify({ status: value }),
            })
            setOriginalStatus(value)
            toast({
                title: "Status Updated",
                description: `Employee status changed to ${value}.`,
                variant: "success",
            });
        } catch (err) {
            console.error('Failed to change status:', err)
            setEmployee((prev) => {
                if (!prev) return prev
                const revert = originalStatus && isEmployeeStatus(originalStatus) ? originalStatus : prev.status
                return { ...prev, status: revert }
            })
            toast({
                title: "Status Update Failed",
                description: err instanceof Error ? err.message : "Unable to update employee status. Please try again.",
                variant: "destructive",
            });
        } finally {
            setStatusSaving(false)
        }
    }

    async function handleSave(bypassCompCheck: boolean | { preventDefault: () => void } = false) {
        if (!employee) return

        const shouldBypass = typeof bypassCompCheck === 'boolean' ? bypassCompCheck : false;

        // 1. Check if Job Level changed and we need confirmation
        if (!shouldBypass && employee.jobLevelId !== originalJobLevelId && employee.jobLevelId) {
            setSaving(true)
            try {
                const template = await apiFetch<any>(`/compensation-templates/job-level/${employee.jobLevelId}`);
                if (template) {
                    setNextTemplate(template);
                    setIsCompDialogOpen(true);
                    setSaving(false);
                    return;
                }
            } catch (err) {
                console.error('Failed to fetch template:', err);
                // If it fails, we proceed without dialog or show error? 
                // Better to proceed but maybe it's safer to alert.
            } finally {
                setSaving(false);
            }
        }
        
        setFormError(null)
        setFieldErrors({})

        // Simple validation logic
        const errors: Record<string, string> = {}
        if (!employee.firstName.trim()) errors.firstName = 'First Name is required'
        if (!employee.lastName.trim()) errors.lastName = 'Last Name is required'
        
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            setFormError('Please fix the highlighted fields.')
            return
        }

        setSaving(true)
        try {
            const {
                firstName, lastName, middleName, alternateEmail, email,
                hireDate, employmentType, orgUnitId, positionId, supervisorId,
                jobLevelId,
                policyId,
                roleIds,
                addressLine1, addressLine2, city, province, postalCode, countryCode,
                profile, identifiers,
            } = employee

            await apiFetch(`/employees/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(removeUndefined({
                    firstName,
                    lastName,
                    middleName: middleName ?? null,
                    alternateEmail: alternateEmail ?? null,
                    email: normalizeEmail(email),
                    hireDate,
                    employmentType,
                    orgUnitId,
                    positionId,
                    jobLevelId: jobLevelId ?? null,
                    supervisorId: supervisorId ?? null,
                    policyId: policyId ?? null,
                    roleIds: roleIds ?? [],
                    addressLine1: addressLine1 ?? null,
                    addressLine2: addressLine2 ?? null,
                    city: city ?? null,
                    province: province ?? null,
                    postalCode: postalCode ?? null,
                    countryCode: countryCode ?? null,
                    profile: (() => {
                        const p = stripSystemFields(profile)
                        if (p) {
                            if (p.mobileNo) p.mobileNo = cleanPhoneNumber(p.mobileNo)
                            if (p.emergencyContactMobileNo) p.emergencyContactMobileNo = cleanPhoneNumber(p.emergencyContactMobileNo)
                            if (p.landlineNo) p.landlineNo = cleanLandline(p.landlineNo)
                        }
                        return p
                    })(),
                    identifiers: stripSystemFields(identifiers),
                })),
            })

            toast({
                title: "Employee Updated",
                description: "Employee details have been successfully saved.",
                variant: "success",
            });
            router.refresh()
        } catch (err) {
            console.error('Failed to save employee:', err)
            setFormError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
            toast({
                title: "Update Failed",
                description: err instanceof Error ? err.message : "Unable to save employee details. Please try again.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    async function handleCancelPendingShift(pendingId: string) {
        if (!confirm('Are you sure you want to cancel this upcoming schedule change?')) return

        try {
            await apiFetch(`/pending-shift-assignments/${pendingId}`, { method: 'DELETE' })
            toast({
                title: "Change Cancelled",
                description: "The pending schedule change has been removed.",
                variant: "success"
            })
            fetchAncillaryData()
        } catch (err) {
            console.error('Failed to cancel pending shift:', err)
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to cancel the pending change.",
                variant: "destructive"
            })
        }
    }

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    if (!employee) return <div className="p-6 text-sm text-muted-foreground">Employee not found.</div>

    const statusCfg = STATUS_CONFIG[employee.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: employee.status }
    const avatarColor = getBackgroundColor(employee.firstName)
    const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase()
    const positionTitle = positions.find((p) => p.id === employee.positionId)?.title

    const isSystemAdmin = currentUser?.roles.includes('ADMIN') || false
    const currentRoleId = employee.roleIds?.[0]
    const currentRoleName = roles.find(r => r.id === currentRoleId)?.name || 'No System Access'

    const filteredStatuses = [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'PROBATION', label: 'Probation' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'RESIGNED', label: 'Resigned' },
        { value: 'TERMINATED', label: 'Terminated' },
    ];

    return (
        <div className="p-6 space-y-6">

            {formError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {formError}
                </div>
            )}

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <div className="flex items-start gap-5">

                        {/* Avatar */}
                        <div
                            className={`hidden sm:flex w-20 h-20 rounded-2xl items-center justify-center text-white text-2xl font-bold select-none shrink-0 shadow-sm`}
                            style={{ backgroundColor: avatarColor }}
                        >
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0 space-y-4">

                            {/* Name row */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 min-w-0">
                                    <h1 className="text-2xl font-bold leading-tight tracking-tight">
                                        {employee.firstName}{employee.middleName ? ` ${employee.middleName}` : ''} {employee.lastName}
                                    </h1>
                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-sm text-muted-foreground font-medium">
                                        <span className="font-mono text-xs bg-muted text-foreground px-2 py-0.5 rounded-md border">
                                            {employee.employeeNo}
                                        </span>
                                        {positionTitle && <span>{positionTitle}</span>}
                                        {currentOrgUnit && (
                                            <>
                                                <span className="opacity-40">·</span>
                                                <span>{currentOrgUnit.name}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase">
                                            {EMPLOYMENT_TYPE_LABELS[employee.employmentType] ?? employee.employmentType}
                                        </span>
                                        {employee.hireDate && (
                                            <> <span className="opacity-40">·</span> Hired {format(new Date(employee.hireDate), 'PP')}</>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col items-end gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} border shadow-xs`}>
                                            <span className={`w-2 h-2 rounded-full ${statusCfg.dot} animate-pulse`} />
                                            {statusCfg.label}
                                        </span>
                                        <Button size="sm" onClick={handleSave} disabled={saving} className="font-bold shadow-md">
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                    <div className="w-48">
                                        <RequiredSelect
                                            value={employee.status}
                                            disabled={statusSaving}
                                            onChangeAction={handleStatusChange}
                                        >
                                            {filteredStatuses.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>Change to {s.label}</SelectItem>
                                            ))}
                                        </RequiredSelect>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl h-12 inline-flex w-auto border">
                    <TabsTrigger value="work" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs uppercase tracking-wider">
                        <ArrowRight className="w-3 h-3 mr-2 opacity-50" />
                        Work & Identity
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs uppercase tracking-wider">
                        <UserIcon className="w-3 h-3 mr-2 opacity-50" />
                        Personal
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs uppercase tracking-wider">
                        <Clock className="w-3 h-3 mr-2 opacity-50" />
                        Schedule & Attendance
                    </TabsTrigger>
                    {(currentUser?.roles.includes('ADMIN') || currentUser?.roles.includes('HR_ADMIN')) && (
                        <>
                        <TabsTrigger value="payroll" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs uppercase tracking-wider">
                            <FileText className="w-3 h-3 mr-2 opacity-50" />
                            Payroll History
                        </TabsTrigger>
                        <TabsTrigger value="compensation" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs uppercase tracking-wider">
                            <Wallet className="w-3 h-3 mr-2 opacity-50" />
                            Compensation
                        </TabsTrigger>
                        {employee.status !== 'ACTIVE' && employee.status !== 'PROBATION' && (
                            <TabsTrigger value="final-pay" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs uppercase tracking-wider">
                                <ArrowRight className="w-3 h-3 mr-2 opacity-50" />
                                Final Pay
                            </TabsTrigger>
                        )}
                        </>
                    )}
                </TabsList>

                <TabsContent value="work" className="space-y-6 outline-hidden">
                    <WorkTab
                        employee={employee}
                        setEmployee={setEmployee}
                        fieldErrors={fieldErrors}
                        isSystemAdmin={isSystemAdmin}
                        roles={roles}
                        currentRoleName={currentRoleName}
                        jobLevels={jobLevels}
                        policies={policies}
                        positions={positions}
                        fetchOrgUnits={fetchOrgUnits}
                        setCurrentOrgUnit={setCurrentOrgUnit}
                        setPositions={setPositions}
                        fetchSupervisors={fetchSupervisors}
                        handleSave={handleSave}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="personal" className="space-y-6 outline-hidden">
                    <PersonalTab
                        employee={employee}
                        setEmployee={setEmployee}
                        fieldErrors={fieldErrors}
                        handleSave={handleSave}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="attendance" className="space-y-6 outline-hidden">
                    <AttendanceTab
                        employee={employee}
                        pendingShifts={pendingShifts}
                        attendanceLogs={attendanceLogs}
                        getShiftDays={getShiftDays}
                        handleCancelPendingShift={handleCancelPendingShift}
                        setIsChangeScheduleOpen={setIsChangeScheduleOpen}
                    />
                </TabsContent>

                {(currentUser?.roles.includes('ADMIN') || currentUser?.roles.includes('HR_ADMIN')) && (
                    <>
                    <TabsContent value="payroll" className="space-y-6 outline-hidden">
                        <PayrollHistoryTab employeeId={id} />
                    </TabsContent>
                    <TabsContent value="compensation" className="space-y-6 outline-hidden">
                        <CompensationTab
                            employee={employee}
                            compensations={compensations}
                            payrollComponents={payrollComponents}
                            fetchAncillaryData={fetchAncillaryData}
                        />
                    </TabsContent>
                    {employee.status !== 'ACTIVE' && employee.status !== 'PROBATION' && (
                        <TabsContent value="final-pay" className="space-y-6 outline-hidden">
                            <FinalPayTab employee={employee} />
                        </TabsContent>
                    )}
                    </>
                )}
            </Tabs>

            <ChangeScheduleDialog 
                open={isChangeScheduleOpen}
                onOpenChange={setIsChangeScheduleOpen}
                employeeId={id}
                employeeName={employee ? `${employee.firstName} ${employee.lastName}` : ''}
                onSuccess={fetchAncillaryData}
            />

            {employee && nextTemplate && (
                <CompensationChangeDialog
                    open={isCompDialogOpen}
                    onOpenChange={setIsCompDialogOpen}
                    onConfirm={() => {
                        setIsCompDialogOpen(false);
                        handleSave(true);
                    }}
                    oldRankName={jobLevels.find(l => l.id === originalJobLevelId)?.name || 'None'}
                    newRankName={jobLevels.find(l => l.id === employee.jobLevelId)?.name || 'None'}
                    currentCompensations={compensations}
                    newTemplateComponents={nextTemplate.components}
                    loading={saving}
                />
            )}
        </div>
    )
}

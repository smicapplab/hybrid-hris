'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequiredInput } from '@/components/ui/required-input'
import { PhoneInput, isValidPHMobile, cleanPhoneNumber } from '@/components/ui/phone-input'
import { LandlineInput, isValidPHLandline, cleanLandline } from '@/components/ui/landline-input'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { BirthdayPickerField } from '@/components/ui/birthday-picker-field'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api'
import { AsyncSearchSelect } from '@/components/ui/async-search-select'
import { removeUndefined, normalizeEmail } from '@/lib/helpers'
import { useAuth } from '@/context/AuthContext'
import type {
    Employee,
    StatusOptionsResponse,
    SupervisorOption,
} from '@/types/employee.type'
import type { OrgUnitOption } from '@/types/org-unit.type'
import type { PositionOption } from '@/types/position.types'
import type { LeavePolicy } from '@/types/leave.types'
import type { Role } from '@/lib/auth-types'
import type { ShiftAssignment, AttendanceLog, PendingChangeItem } from '@/types/attendance.types'
import {
    isEmployeeStatus,
    isEmploymentType,
    isGender,
    isCivilStatus,
} from '@hybrid-hris/domain'
import { DEFAULT_IDENTIFIERS, DEFAULT_PROFILE } from '../config'
import { SectionHeading, stripSystemFields } from '../helpers'
import { getBackgroundColor } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from "@/hooks/use-toast";
import { COUNTRY_OPTIONS, EMPLOYMENT_TYPE_LABELS, STATUS_CONFIG, TIMEZONE_OPTIONS } from '@/lib/employee.enum'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar as CalendarIcon, ArrowRight, ShieldCheck, User as UserIcon, Trash2, Wallet } from 'lucide-react'
import { ChangeScheduleDialog } from '../components/change-schedule-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

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
    const [allowedNextStatuses, setAllowedNextStatuses] = useState<string[]>([])
    const [positions, setPositions] = useState<PositionOption[]>([])
    const [jobLevels, setJobLevels] = useState<JobLevel[]>([])
    const [policies, setPolicies] = useState<LeavePolicy[]>([])
    const [roles, setRoles] = useState<Role[]>([])
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

    const refreshStatusOptions = useCallback(async () => {
        try {
            const opts = await apiFetch<StatusOptionsResponse>(`/employees/${id}/status/options`)
            setAllowedNextStatuses(opts.allowedNext)
        } catch (err) {
            console.error('Failed to refresh status options:', err)
            setAllowedNextStatuses([])
        }
    }, [id])

    const refreshShift = useCallback(async () => {
        try {
            const [shift, pending, logs] = await Promise.all([
                apiFetch<ShiftAssignment>(`/shift-assignments?employeeId=${id}`).catch(() => null),
                apiFetch<PendingChangeItem[]>(`/pending-shift-assignments?employeeId=${id}&status=PENDING`).catch(() => []),
                apiFetch<AttendanceLog[]>(`/attendance?employeeId=${id}`).catch(() => [])
            ])
            setEmployee(prev => prev ? { ...prev, shiftAssignment: shift } : prev)
            setPendingShifts(pending)
            setAttendanceLogs(logs)
        } catch (err) {
            console.error('Failed to fetch shift/attendance data:', err)
        }
    }, [id])

    useEffect(() => {
        async function fetchEmployee() {
            try {
                const data = await apiFetch<Employee>(`/employees/${id}`)
                setEmployee(data)
                setOriginalStatus(data.status)

                const [, orgUnit, positionsData, jobLevelsData, policiesData, rolesData] = await Promise.all([
                    refreshStatusOptions(),
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

                // Fetch shift assignment and logs
                refreshShift()
            } catch (err) {
                console.error('Failed to fetch employee details:', err)
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchEmployee()
    }, [id, refreshShift, refreshStatusOptions])

    function validateEmployee(e: Employee, availablePositions: PositionOption[]): Record<string, string> {
        const errors: Record<string, string> = {}
        if (!(e.email ?? '').trim()) errors.email = 'Login Email is required'
        if (!e.firstName.trim()) errors.firstName = 'First Name is required'
        if (!e.lastName.trim()) errors.lastName = 'Last Name is required'
        if (!e.hireDate.trim()) errors.hireDate = 'Hire Date is required'
        if (!e.employmentType.trim()) errors.employmentType = 'Employment Type is required'
        if (!e.orgUnitId.trim()) errors.orgUnitId = 'Org Unit is required'
        if (!e.positionId.trim()) errors.positionId = 'Position is required'
        if (availablePositions.length > 0 && e.positionId.trim()) {
            if (!availablePositions.some((p) => p.id === e.positionId)) {
                errors.positionId = 'Position is not allowed in the specified org unit'
            }
        }

        // Phone validation
        if (e.profile?.mobileNo && !isValidPHMobile(e.profile.mobileNo)) {
            errors.mobileNo = 'Invalid format'
        }
        if (e.profile?.emergencyContactMobileNo && !isValidPHMobile(e.profile.emergencyContactMobileNo)) {
            errors.emergencyContactMobileNo = 'Invalid format'
        }
        if (e.profile?.landlineNo && !isValidPHLandline(e.profile.landlineNo)) {
            errors.landlineNo = 'Invalid format'
        }

        return errors
    }

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
            await refreshStatusOptions()
            setStatusSaving(false)
        }
    }

    async function handleSave() {
        if (!employee) return

        setFormError(null)
        setFieldErrors({})

        const errors = validateEmployee(employee, positions)
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
            refreshShift()
        } catch (err) {
            console.error('Failed to cancel pending shift:', err)
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to cancel the pending change.",
                variant: "destructive"
            })
        }
    }

    const filteredStatuses = [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'PROBATION', label: 'Probation' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'RESIGNED', label: 'Resigned' },
        { value: 'TERMINATED', label: 'Terminated' },
    ].filter((s) =>
        !allowedNextStatuses.length || !employee
            ? true
            : new Set([employee.status, ...allowedNextStatuses]).has(s.value),
    )

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    if (!employee) return <div className="p-6 text-sm text-muted-foreground">Employee not found.</div>

    const statusCfg = STATUS_CONFIG[employee.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: employee.status }
    const avatarColor = getBackgroundColor(employee.firstName)
    const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase()
    const positionTitle = positions.find((p) => p.id === employee.positionId)?.title

    const isSystemAdmin = currentUser?.roles.includes('ADMIN')
    const currentRoleId = employee.roleIds?.[0]
    const currentRoleName = roles.find(r => r.id === currentRoleId)?.name || 'No System Access'

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
                                    <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
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
                    <TabsTrigger value="work" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                        <ArrowRight className="w-3 h-3 mr-2 opacity-50" />
                        Work & Identity
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                        <UserIcon className="w-3 h-3 mr-2 opacity-50" />
                        Personal
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                        <Clock className="w-3 h-3 mr-2 opacity-50" />
                        Schedule & Attendance
                    </TabsTrigger>
                    <TabsTrigger value="compensation" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                        <Wallet className="w-3 h-3 mr-2 opacity-50" />
                        Compensation
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="work" className="space-y-6 outline-hidden">
                    <Card className="shadow-sm border-muted/60">
                        <CardContent className="pt-8 space-y-10">
                            {/* Basic Information */}
                            <div className="space-y-6">
                                <SectionHeading>Basic Information</SectionHeading>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <RequiredInput
                                        label="Employee No"
                                        value={employee.employeeNo}
                                        onChangeAction={() => { }}
                                        disabled
                                    />
                                    <RequiredInput
                                        label="Login Email"
                                        value={employee.email ?? ''}
                                        required
                                        touched={!!fieldErrors.email}
                                        errorMessage={fieldErrors.email}
                                        onChangeAction={(v) => setEmployee({ ...employee, email: v })}
                                    />
                                    <RequiredInput
                                        label="Alternate Email"
                                        value={employee.alternateEmail ?? ''}
                                        onChangeAction={(v) => setEmployee({ ...employee, alternateEmail: v })}
                                    />

                                    <RequiredInput
                                        label="First Name"
                                        value={employee.firstName}
                                        required
                                        touched={!!fieldErrors.firstName}
                                        errorMessage={fieldErrors.firstName}
                                        onChangeAction={(v) => setEmployee({ ...employee, firstName: v })}
                                    />
                                    <RequiredInput
                                        label="Last Name"
                                        value={employee.lastName}
                                        required
                                        touched={!!fieldErrors.lastName}
                                        errorMessage={fieldErrors.lastName}
                                        onChangeAction={(v) => setEmployee({ ...employee, lastName: v })}
                                    />
                                    <RequiredInput
                                        label="Middle Name"
                                        value={employee.middleName ?? ''}
                                        onChangeAction={(v) => setEmployee({ ...employee, middleName: v })}
                                    />

                                </div>
                            </div>

                            <Separator />

                            {/* Employment Details */}
                            <div className="space-y-6">
                                <SectionHeading>Employment Details</SectionHeading>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <DatePickerField
                                        label="Hire Date"
                                        value={employee.hireDate}
                                        onChangeAction={(v) => setEmployee({ ...employee, hireDate: v })}
                                        required
                                        error={fieldErrors.hireDate}
                                    />

                                    <RequiredSelect
                                        label="Employment Type"
                                        value={employee.employmentType}
                                        required
                                        touched={!!fieldErrors.employmentType}
                                        errorMessage={fieldErrors.employmentType}
                                        onChangeAction={(v) => {
                                            if (!isEmploymentType(v)) return
                                            setEmployee({ ...employee, employmentType: v })
                                        }}
                                    >
                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                        <SelectItem value="PROBATIONARY">Probationary</SelectItem>
                                        <SelectItem value="CONTRACTUAL">Contractual</SelectItem>
                                        <SelectItem value="CONSULTANT">Consultant</SelectItem>
                                        <SelectItem value="INTERN">Intern</SelectItem>
                                    </RequiredSelect>

                                    <RequiredSelect
                                        label="Job Level / Rank"
                                        value={employee.jobLevelId ?? 'none'}
                                        onChangeAction={(v) => setEmployee({ ...employee, jobLevelId: v === 'none' ? null : v })}
                                    >
                                        <SelectItem value="none">Not Assigned</SelectItem>
                                        {jobLevels.map((l) => (
                                            <SelectItem key={l.id} value={l.id}>{l.name} ({l.code})</SelectItem>
                                        ))}
                                    </RequiredSelect>

                                    <RequiredSelect
                                        label="Timezone"
                                        value={employee.timezone ?? 'UTC'}
                                        onChangeAction={(v) => setEmployee({ ...employee, timezone: v })}
                                    >
                                        {TIMEZONE_OPTIONS.map((tz) => (
                                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                        ))}
                                    </RequiredSelect>

                                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                        <div className="md:col-span-2">
                                            <AsyncSearchSelect
                                                label="Org Unit"
                                                value={employee.orgUnitId}
                                                onChangeAction={async (value) => {
                                                    if (!value) return
                                                    setEmployee((prev) => prev ? { ...prev, orgUnitId: value } : prev)
                                                    try {
                                                        const ou = await apiFetch<OrgUnitOption>(`/org-units/${value}`)
                                                        setCurrentOrgUnit(ou)
                                                    } catch (err) {
                                                        console.error(err)
                                                        setCurrentOrgUnit(null)
                                                    }
                                                    const positionsData = await apiFetch<PositionOption[]>(`/org-units/${value}/positions`)
                                                    setPositions(positionsData)
                                                    setEmployee((prev) => prev ? { ...prev, positionId: positionsData[0]?.id ?? '' } : prev)
                                                }}
                                                fetchOptions={fetchOrgUnits}
                                                getOptionValue={(o) => o.id}
                                                getOptionLabel={(o) => {
                                                    const base = o.path?.trim() ? o.path : o.name
                                                    return o.code?.trim() ? `${base} (${o.code})` : base
                                                }}
                                                placeholder="Search org unit..."
                                            />
                                        </div>

                                        <div className="md:col-span-1 self-end">
                                            <RequiredSelect
                                                label="Position"
                                                value={employee.positionId || ''}
                                                required
                                                touched={!!fieldErrors.positionId}
                                                errorMessage={fieldErrors.positionId}
                                                onChangeAction={(v) => setEmployee({ ...employee, positionId: v })}
                                            >
                                                {positions.map((pos) => (
                                                    <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                                                ))}
                                            </RequiredSelect>
                                        </div>
                                    </div>

                                    <AsyncSearchSelect
                                        label="Supervisor"
                                        value={employee.supervisorId}
                                        onChangeAction={(v) => setEmployee({ ...employee, supervisorId: v })}
                                        fetchOptions={fetchSupervisors}
                                        getOptionValue={(o) => o.id}
                                        getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                                        excludeIds={[employee.id]}
                                        placeholder="Search supervisor..."
                                    />

                                    <RequiredSelect
                                        label="Leave Policy"
                                        value={employee.policyId ?? 'none'}
                                        onChangeAction={(v) => setEmployee({ ...employee, policyId: v === 'none' ? null : v })}
                                    >
                                        <SelectItem value="none">No Policy</SelectItem>
                                        {policies.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                                        ))}
                                    </RequiredSelect>
                                </div>
                            </div>

                            <Separator />

                            {/* System Access */}
                            <div className="space-y-6">
                                <SectionHeading>System Access</SectionHeading>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        {isSystemAdmin ? (
                                            <RequiredSelect
                                                label="System Role"
                                                value={employee.roleIds?.[0] ?? 'none'}
                                                onChangeAction={(v) => {
                                                    setEmployee((prev) => {
                                                        if (!prev) return prev;
                                                        const roleIds = v === 'none' ? [] : [v];
                                                        return { ...prev, roleIds };
                                                    });
                                                }}
                                            >
                                                <SelectItem value="none">No System Access</SelectItem>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </RequiredSelect>
                                        ) : (
                                            <RequiredInput
                                                label="System Role"
                                                value={currentRoleName}
                                                onChangeAction={() => { }}
                                                disabled
                                            />
                                        )}
                                        <p className="text-xs text-muted-foreground italic px-1">
                                            {isSystemAdmin
                                                ? "Determines the user's permission level in the system."
                                                : "Only System Administrators can modify roles."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Government IDs */}
                            <div className="space-y-6">
                                <SectionHeading>Government IDs</SectionHeading>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {(
                                        [
                                            ['tinNo', 'TIN No'],
                                            ['sssNo', 'SSS No'],
                                            ['philHealthNo', 'PhilHealth No'],
                                            ['pagIbigNo', 'Pag-IBIG No'],
                                        ] as const
                                    ).map(([field, label]) => (
                                        <RequiredInput
                                            key={field}
                                            label={label}
                                            value={employee.identifiers?.[field] ?? ''}
                                            onChangeAction={(v) =>
                                                setEmployee((prev) => prev ? {
                                                    ...prev,
                                                    identifiers: { ...(prev.identifiers ?? { ...DEFAULT_IDENTIFIERS, employeeId: prev.id }), [field]: v },
                                                } : prev)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={saving} className="font-bold min-w-35">
                                    {saving ? 'Saving...' : 'Save All Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="personal" className="space-y-6 outline-hidden">
                    <Card className="shadow-sm border-muted/60">
                        <CardContent className="pt-8 space-y-10">
                            {/* Personal Profile */}
                            <div className="space-y-6">
                                <SectionHeading>Demographics & Contacts</SectionHeading>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <BirthdayPickerField
                                        value={employee.profile?.birthDate}
                                        onChangeAction={(v) =>
                                            setEmployee((prev) => prev ? {
                                                ...prev,
                                                profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), birthDate: v },
                                            } : prev)
                                        }
                                    />

                                    <RequiredSelect
                                        label="Gender"
                                        value={employee.profile?.gender ?? ''}
                                        onChangeAction={(v) => {
                                            if (!isGender(v)) return
                                            setEmployee((prev) => prev ? {
                                                ...prev,
                                                profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), gender: v },
                                            } : prev)
                                        }}
                                    >
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                    </RequiredSelect>

                                    <RequiredSelect
                                        label="Civil Status"
                                        value={employee.profile?.civilStatus ?? ''}
                                        onChangeAction={(v) => {
                                            if (!isCivilStatus(v)) return
                                            setEmployee((prev) => prev ? {
                                                ...prev,
                                                profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), civilStatus: v },
                                            } : prev)
                                        }}
                                    >
                                        <SelectItem value="SINGLE">Single</SelectItem>
                                        <SelectItem value="MARRIED">Married</SelectItem>
                                        <SelectItem value="SEPARATED">Separated</SelectItem>
                                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                                        <SelectItem value="ANNULLED">Annulled</SelectItem>
                                    </RequiredSelect>

                                    {(
                                        [
                                            ['mobileNo', 'Mobile No'],
                                            ['landlineNo', 'Landline No'],
                                            ['emergencyContactName', 'Emergency Contact Name'],
                                            ['emergencyContactMobileNo', 'Emergency Contact Mobile No'],
                                        ] as const
                                    ).map(([field, label]) => {
                                        const isMobile = field.toLowerCase().includes('mobile');
                                        const isLandline = field.toLowerCase().includes('landline');
                                        const val = employee.profile?.[field] ?? '';

                                        const onChange = (v: string) =>
                                            setEmployee((prev) => prev ? {
                                                ...prev,
                                                profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), [field]: v },
                                            } : prev);

                                        if (isMobile) {
                                            return (
                                                <div key={field} className="space-y-1 text-foreground">
                                                    <Label>{label}</Label>
                                                    <PhoneInput
                                                        value={val}
                                                        error={!!fieldErrors[field]}
                                                        onChangeAction={onChange}
                                                    />
                                                    {fieldErrors[field] && (
                                                        <p className="text-[10px] text-destructive font-medium uppercase tracking-tight mt-1">{fieldErrors[field]}</p>
                                                    )}
                                                </div>
                                            );
                                        }

                                        if (isLandline) {
                                            return (
                                                <div key={field} className="space-y-1 text-foreground">
                                                    <Label>{label}</Label>
                                                    <LandlineInput
                                                        value={val}
                                                        error={!!fieldErrors[field]}
                                                        onChangeAction={onChange}
                                                    />
                                                    {fieldErrors[field] && (
                                                        <p className="text-[10px] text-destructive font-medium uppercase tracking-tight mt-1">{fieldErrors[field]}</p>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <RequiredInput
                                                key={field}
                                                label={label}
                                                value={val}
                                                touched={!!fieldErrors[field]}
                                                errorMessage={fieldErrors[field]}
                                                onChangeAction={onChange}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator />

                            {/* Address */}
                            <div className="space-y-6">
                                <SectionHeading>Address Information</SectionHeading>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <RequiredInput
                                        label="Address Line 1"
                                        value={employee.addressLine1 ?? ''}
                                        onChangeAction={(v) => setEmployee({ ...employee, addressLine1: v })}
                                    />
                                    <RequiredInput
                                        label="Address Line 2"
                                        value={employee.addressLine2 ?? ''}
                                        onChangeAction={(v) => setEmployee({ ...employee, addressLine2: v })}
                                    />
                                    <RequiredInput
                                        label="City"
                                        value={employee.city ?? ''}
                                        onChangeAction={(v) => setEmployee({ ...employee, city: v })}
                                    />
                                    <RequiredInput
                                        label="Province"
                                        value={employee.province ?? ''}
                                        onChangeAction={(v) => setEmployee({ ...employee, province: v })}
                                    />
                                    <RequiredInput
                                        label="Postal Code"
                                        value={employee.postalCode ?? ''}
                                        onChangeAction={(v) => setEmployee({ ...employee, postalCode: v })}
                                    />
                                    <RequiredSelect
                                        label="Country Code"
                                        value={employee.countryCode ?? 'PH'}
                                        onChangeAction={(v) => setEmployee({ ...employee, countryCode: v })}
                                    >
                                        {COUNTRY_OPTIONS.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.name} ({c.code})
                                            </SelectItem>
                                        ))}
                                    </RequiredSelect>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={saving} className="font-bold min-w-35">
                                    {saving ? 'Saving...' : 'Save All Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance" className="space-y-6 outline-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Active Shift Card */}
                        <Card className="lg:col-span-2 shadow-sm border-muted/60">
                            <CardContent className="pt-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <SectionHeading>Active Shift Schedule</SectionHeading>
                                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-bold">
                                        Active
                                    </Badge>
                                </div>

                                {employee.shiftAssignment ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                                    <Clock className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Working Hours</p>
                                                    <p className="text-lg font-extrabold tracking-tight">
                                                        {employee.shiftAssignment.startTime} — {employee.shiftAssignment.endTime}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {employee.shiftAssignment.breakMinutes}m break · {employee.shiftAssignment.gracePeriodMinutes || 0}m grace · {employee.shiftAssignment.isFlexible ? 'Flexible' : 'Fixed'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Schedule Days</p>
                                                    <p className="text-lg font-extrabold tracking-tight">
                                                        {getShiftDays(employee.shiftAssignment)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Effective from {format(new Date(employee.shiftAssignment.effectiveFrom), 'PP')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <Button variant="outline" size="sm" className="font-bold" onClick={() => setIsChangeScheduleOpen(true)}>
                                                Change Schedule
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed rounded-2xl">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div className="max-w-75 space-y-1">
                                            <p className="font-bold">No active shift assigned</p>
                                            <p className="text-xs text-muted-foreground">
                                                This employee doesn&apos;t have a regular shift schedule yet. 
                                                Assign one to enable automated attendance tracking.
                                            </p>
                                        </div>
                                        <Button size="sm" className="font-bold" onClick={() => setIsChangeScheduleOpen(true)}>
                                            Assign Initial Shift
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Summary / Stats Card */}
                        <Card className="shadow-sm border-muted/60 bg-muted/20">
                            <CardContent className="pt-8 space-y-6">
                                <SectionHeading>Upcoming Changes</SectionHeading>
                                
                                <div className="space-y-4">
                                    {pendingShifts.length > 0 ? (
                                        pendingShifts.map(shift => (
                                            <div key={shift.id} className="p-4 bg-background rounded-xl border border-primary/20 shadow-xs space-y-3 relative group">
                                                <div className="flex items-center justify-between">
                                                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 text-[10px] font-bold">
                                                        PENDING
                                                    </Badge>
                                                    <button 
                                                        onClick={() => handleCancelPendingShift(shift.id)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                                        title="Cancel change"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold">{shift.startTime} — {shift.endTime}</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium">
                                                        Effective {format(new Date(shift.effectiveDate), 'PP')}
                                                    </p>
                                                </div>
                                                <div className="pt-1 text-[10px] font-bold text-primary uppercase tracking-tighter">
                                                    {getShiftDays(shift)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 bg-background rounded-xl border border-muted/60 flex flex-col items-center justify-center text-center py-8 space-y-2">
                                            <ShieldCheck className="w-8 h-8 text-muted-foreground/30" />
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Pending Changes</p>
                                        </div>
                                    )}

                                    <div className="pt-4 space-y-3">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Quick Links</p>
                                        <Button variant="ghost" className="w-full justify-start text-xs font-medium h-9 rounded-lg">
                                            <CalendarIcon className="w-4 h-4 mr-2" />
                                            View Leave Calendar
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start text-xs font-medium h-9 rounded-lg">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Recent Attendance Logs
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance Logs Table */}
                    <Card className="shadow-sm border-muted/60 overflow-hidden">
                        <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest">Recent Attendance History</h3>
                            <Badge variant="secondary" className="font-bold text-[10px]">
                                LAST {attendanceLogs.length} ENTRIES
                            </Badge>
                        </div>
                        <CardContent className="p-0">
                            {attendanceLogs.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/10">
                                            <TableHead className="font-bold text-xs uppercase">Date</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Scheduled</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Time In</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Time Out</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Hours</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium text-sm">
                                                    {format(new Date(log.workDate), 'PP')}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {log.scheduledInAt && log.scheduledOutAt ? (
                                                        `${format(new Date(log.scheduledInAt), 'p')} - ${format(new Date(log.scheduledOutAt), 'p')}`
                                                    ) : 'Unscheduled'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {log.actualInAt ? format(new Date(log.actualInAt), 'p') : '—'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {log.actualOutAt ? format(new Date(log.actualOutAt), 'p') : (
                                                        <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-200 bg-amber-50">OPEN</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {log.totalHours || '0.00'}h
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tight">
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center text-muted-foreground italic">
                                    <p className="text-sm">No attendance records found for this employee.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compensation" className="space-y-6 outline-hidden">
                    <Card className="shadow-sm border-muted/60">
                        <CardContent className="pt-10 pb-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-2">
                                <Wallet className="w-8 h-8 text-primary" />
                            </div>
                            <div className="max-w-100 space-y-2">
                                <h3 className="text-xl font-bold">Compensation & Benefits</h3>
                                <p className="text-sm text-muted-foreground">
                                    Manage salaries, recurring allowances, and statutory benefits for this employee. 
                                    This module is part of the upcoming Payroll integration.
                                </p>
                            </div>
                            {employee.jobLevelName && (
                                <div className="mt-4 p-4 border rounded-xl bg-muted/30">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Job Level</p>
                                    <p className="text-lg font-extrabold">{employee.jobLevelName}</p>
                                </div>
                            )}
                            <Button variant="outline" className="mt-4 font-bold border-primary/20 hover:bg-primary/5 text-primary">
                                Configuration Coming Soon
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ChangeScheduleDialog 
                open={isChangeScheduleOpen}
                onOpenChange={setIsChangeScheduleOpen}
                employeeId={id}
                employeeName={employee ? `${employee.firstName} ${employee.lastName}` : ''}
                onSuccess={refreshShift}
            />
        </div>
    )
}

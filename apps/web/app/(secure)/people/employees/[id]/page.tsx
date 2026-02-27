'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequiredInput } from '@/components/ui/required-input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RequiredSelect } from '@/components/ui/required-select'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api'
import { AsyncSearchSelect } from '@/components/ui/async-search-select'
import { SelectItem } from '@/components/ui/select'
import { removeUndefined, normalizeEmail } from '@/lib/helpers'
import type {
    Employee,
    EmployeeProfile,
    EmployeeIdentifiers,
    StatusOptionsResponse,
    SupervisorOption,
} from '@/types/employee.type'
import type { OrgUnitOption } from '@/types/org-unit.type'
import type { PositionOption } from '@/types/position.types'
import {
    isEmployeeStatus,
    isEmploymentType,
    isGender,
    isCivilStatus,
} from '@hybrid-hris/domain'

const DEFAULT_PROFILE: EmployeeProfile = {
    employeeId: '',
    birthDate: null,
    gender: null,
    civilStatus: null,
    nationality: null,
    personalEmail: null,
    mobileNo: null,
    landlineNo: null,
    emergencyContactName: null,
    emergencyContactRelationship: null,
    emergencyContactMobileNo: null,
    notes: null,
}

const DEFAULT_IDENTIFIERS: EmployeeIdentifiers = {
    employeeId: '',
    tinNo: null,
    sssNo: null,
    philHealthNo: null,
    pagIbigNo: null,
    umidNo: null,
    passportNo: null,
    passportExpiry: null,
    driversLicenseNo: null,
    driversLicenseExpiry: null,
    prcLicenseNo: null,
    prcLicenseExpiry: null,
    companyIdNo: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripSystemFields<T extends object>(
    obj: T | null | undefined,
): Omit<T, 'employeeId' | 'createdAt' | 'updatedAt'> | null {
    if (!obj) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { employeeId: _eid, createdAt: _ca, updatedAt: _ua, ...rest } = obj as T & {
        employeeId?: unknown
        createdAt?: unknown
        updatedAt?: unknown
    }
    return rest
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [employee, setEmployee] = useState<Employee | null>(null)
    const [originalStatus, setOriginalStatus] = useState<string | null>(null)
    const [allowedNextStatuses, setAllowedNextStatuses] = useState<string[]>([])
    const [positions, setPositions] = useState<PositionOption[]>([])
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitOption | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [statusSaving, setStatusSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    async function refreshStatusOptions() {
        try {
            const opts = await apiFetch<StatusOptionsResponse>(`/employees/${id}/status/options`)
            setAllowedNextStatuses(opts.allowedNext)
        } catch {
            setAllowedNextStatuses([])
        }
    }

    useEffect(() => {
        async function fetchEmployee() {
            try {
                const data = await apiFetch<Employee>(`/employees/${id}`)
                setEmployee(data)
                setOriginalStatus(data.status)

                const [, orgUnit, positionsData] = await Promise.all([
                    refreshStatusOptions(),
                    apiFetch<OrgUnitOption>(`/org-units/${data.orgUnitId}`),
                    apiFetch<PositionOption[]>(`/org-units/${data.orgUnitId}/positions`),
                ])

                setCurrentOrgUnit(orgUnit)
                setPositions(positionsData)

                if (positionsData.length > 0 && !positionsData.some((p) => p.id === data.positionId)) {
                    setEmployee((prev) => prev ? { ...prev, positionId: positionsData[0]!.id } : prev)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchEmployee()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

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
        } catch (err) {
            console.error(err)
            setEmployee((prev) => {
                if (!prev) return prev
                const revert = originalStatus && isEmployeeStatus(originalStatus) ? originalStatus : prev.status
                return { ...prev, status: revert }
            })
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
                    supervisorId: supervisorId ?? null,
                    addressLine1: addressLine1 ?? null,
                    addressLine2: addressLine2 ?? null,
                    city: city ?? null,
                    province: province ?? null,
                    postalCode: postalCode ?? null,
                    countryCode: countryCode ?? null,
                    profile: stripSystemFields(profile),
                    identifiers: stripSystemFields(identifiers),
                })),
            })

            router.refresh()
        } catch (err) {
            console.error(err)
            setFormError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
        } finally {
            setSaving(false)
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

    if (loading) return <div className="p-6">Loading...</div>
    if (!employee) return <div className="p-6">Employee not found</div>

    return (
        <div className="p-6 space-y-6">
            {formError && <div className="text-sm text-red-600">{formError}</div>}

            {/* Employment Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Employment Status</CardTitle>
                </CardHeader>
                <CardContent className="max-w-md space-y-2">
                    <RequiredSelect
                        label="Status"
                        value={employee.status}
                        required
                        disabled={statusSaving}
                        touched={!!fieldErrors.status}
                        errorMessage={fieldErrors.status}
                        onChangeAction={handleStatusChange}
                    >
                        {filteredStatuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </RequiredSelect>
                </CardContent>
            </Card>

            {/* Employee Profile */}
            <Card>
                <CardHeader>
                    <CardTitle>Edit Employee</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <RequiredInput label="Employee No" value={employee.employeeNo} onChangeAction={() => { }} disabled />
                        <RequiredInput
                            label="Login Email"
                            value={employee.email ?? ''}
                            required
                            touched={!!fieldErrors.email}
                            errorMessage={fieldErrors.email}
                            onChangeAction={(v) => setEmployee({ ...employee, email: v })}
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
                        <RequiredInput
                            label="Alternate Email"
                            value={employee.alternateEmail ?? ''}
                            onChangeAction={(v) => setEmployee({ ...employee, alternateEmail: v })}
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn('w-full justify-start text-left font-normal', !employee.hireDate && 'text-muted-foreground')}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {employee.hireDate ? format(new Date(employee.hireDate), 'yyyy-MM-dd') : 'Pick a date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={employee.hireDate ? new Date(employee.hireDate) : undefined}
                                    onSelect={(date) => {
                                        if (!date) return
                                        setEmployee({ ...employee, hireDate: format(date, 'yyyy-MM-dd') })
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

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

                        <AsyncSearchSelect
                            label="Org Unit"
                            value={employee.orgUnitId}
                            onChange={async (value) => {
                                if (!value) return
                                setEmployee((prev) => prev ? { ...prev, orgUnitId: value } : prev)
                                try {
                                    setCurrentOrgUnit(await apiFetch<OrgUnitOption>(`/org-units/${value}`))
                                } catch {
                                    setCurrentOrgUnit(null)
                                }
                                const positionsData = await apiFetch<PositionOption[]>(`/org-units/${value}/positions`)
                                setPositions(positionsData)
                                setEmployee((prev) => prev ? { ...prev, positionId: positionsData[0]?.id ?? '' } : prev)
                            }}
                            fetchOptions={async (search) => {
                                const list = await apiFetch<OrgUnitOption[]>(
                                    `/org-units/search?leavesOnly=true&showDeleted=false&limit=20&query=${encodeURIComponent(search)}`,
                                )
                                if (currentOrgUnit && !list.some((ou) => ou.id === currentOrgUnit.id)) {
                                    return [currentOrgUnit, ...list]
                                }
                                return list
                            }}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) => {
                                const base = o.path?.trim() ? o.path : o.name
                                return o.code?.trim() ? `${base} (${o.code})` : base
                            }}
                            placeholder="Search org unit..."
                        />

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

                        <AsyncSearchSelect
                            label="Supervisor"
                            value={employee.supervisorId}
                            onChange={(v) => setEmployee({ ...employee, supervisorId: v })}
                            fetchOptions={async (search) => {
                                const res = await apiFetch<{ data: SupervisorOption[] }>(
                                    `/employees?status=ACTIVE&search=${encodeURIComponent(search)}&pageSize=20`,
                                )
                                return res.data
                            }}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                            excludeIds={[employee.id]}
                            placeholder="Search supervisor..."
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['addressLine1', 'addressLine2', 'city', 'province', 'postalCode', 'countryCode'] as const).map((field) => (
                            <RequiredInput
                                key={field}
                                label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                                value={employee[field] ?? ''}
                                onChangeAction={(v) => setEmployee({ ...employee, [field]: v })}
                            />
                        ))}
                    </div>

                    <Separator />

                    {/* Profile Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn('w-full justify-start text-left font-normal', !employee.profile?.birthDate && 'text-muted-foreground')}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {employee.profile?.birthDate
                                        ? format(new Date(employee.profile.birthDate), 'yyyy-MM-dd')
                                        : 'Pick a date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={employee.profile?.birthDate ? new Date(employee.profile.birthDate) : undefined}
                                    onSelect={(date) => {
                                        if (!date) return
                                        setEmployee((prev) => prev ? {
                                            ...prev,
                                            profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), birthDate: format(date, 'yyyy-MM-dd') },
                                        } : prev)
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

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
                            <SelectItem value="NON_BINARY">Non-binary</SelectItem>
                            <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
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
                            <SelectItem value="LIVE_IN">Live-in</SelectItem>
                        </RequiredSelect>

                        {(['mobileNo', 'emergencyContactName', 'emergencyContactMobileNo'] as const).map((field) => (
                            <RequiredInput
                                key={field}
                                label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                                value={employee.profile?.[field] ?? ''}
                                onChangeAction={(v) =>
                                    setEmployee((prev) => prev ? {
                                        ...prev,
                                        profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), [field]: v },
                                    } : prev)
                                }
                            />
                        ))}
                    </div>

                    <Separator />

                    {/* Government Identifiers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
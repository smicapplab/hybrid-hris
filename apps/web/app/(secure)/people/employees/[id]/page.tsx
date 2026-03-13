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
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api'
import { AsyncSearchSelect } from '@/components/ui/async-search-select'
import { SelectItem } from '@/components/ui/select'
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

export default function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { toast } = useToast();
    const { user: currentUser } = useAuth()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [originalStatus, setOriginalStatus] = useState<string | null>(null)
    const [allowedNextStatuses, setAllowedNextStatuses] = useState<string[]>([])
    const [positions, setPositions] = useState<PositionOption[]>([])
    const [policies, setPolicies] = useState<LeavePolicy[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitOption | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [statusSaving, setStatusSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const fetchOrgUnits = useCallback(async (search: string) => {
        const list = await apiFetch<OrgUnitOption[]>(
            `/org-units/search?leavesOnly=true&showDeleted=false&limit=20&query=${encodeURIComponent(search)}`,
        )
        if (currentOrgUnit && !list.some((ou) => ou.id === currentOrgUnit.id)) {
            return [currentOrgUnit, ...list]
        }
        return list
    }, [currentOrgUnit])

    const fetchSupervisors = useCallback(async (search: string) => {
        const res = await apiFetch<{ data: SupervisorOption[] }>(
            `/employees?status=ACTIVE&search=${encodeURIComponent(search)}&pageSize=20`,
        )
        return res.data
    }, [])

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

                const [, orgUnit, positionsData, policiesData, rolesData] = await Promise.all([
                    refreshStatusOptions(),
                    apiFetch<OrgUnitOption>(`/org-units/${data.orgUnitId}`),
                    apiFetch<PositionOption[]>(`/org-units/${data.orgUnitId}/positions`),
                    apiFetch<LeavePolicy[]>('/leave-policies?active=true'),
                    apiFetch<Role[]>('/roles'),
                ])

                console.log({
                    data, orgUnit, positionsData, policiesData, rolesData
                })

                setCurrentOrgUnit(orgUnit)
                setPositions(positionsData)
                setPolicies(policiesData)
                setRoles(rolesData)

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
            console.error(err)
            setEmployee((prev) => {
                if (!prev) return prev
                const revert = originalStatus && isEmployeeStatus(originalStatus) ? originalStatus : prev.status
                return { ...prev, status: revert }
            })
            toast({
                title: "Status Update Failed",
                description: "Unable to update employee status. Please try again.",
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
            console.error(err)
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

            <Card>
                <CardContent className="pt-6 pb-5">
                    <div className="flex items-start gap-5">

                        {/* Avatar */}
                        <div
                            className={`hidden sm:flex w-16 h-16 rounded-full items-center justify-center text-white text-xl font-bold select-none`}
                            style={{ backgroundColor: avatarColor }}
                        >
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0 space-y-4">

                            {/* Name row */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 min-w-0">
                                    <h1 className="text-2xl font-bold leading-tight">
                                        {employee.firstName}{employee.middleName ? ` ${employee.middleName}` : ''} {employee.lastName}
                                    </h1>
                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                                        <span className="font-mono text-xs bg-muted text-foreground px-1.5 py-0.5 rounded">
                                            {employee.employeeNo}
                                        </span>
                                        {positionTitle && <span>{positionTitle}</span>}
                                        {currentOrgUnit && (
                                            <>
                                                <span>·</span>
                                                <span>{currentOrgUnit.name}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {EMPLOYMENT_TYPE_LABELS[employee.employmentType] ?? employee.employmentType}
                                        {employee.hireDate && (
                                            <> · Hired {format(new Date(employee.hireDate), 'PP')}</>
                                        )}
                                    </div>
                                </div>

                                {/* Status badge + save */}
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                        {statusCfg.label}
                                    </span>
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>

                            {/* Status change strip */}
                            <div className="flex items-end gap-3 pt-3 border-t">
                                <div className="w-44">
                                    <RequiredSelect
                                        label="Change Status"
                                        value={employee.status}
                                        disabled={statusSaving}
                                        onChangeAction={handleStatusChange}
                                    >
                                        {filteredStatuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </RequiredSelect>
                                </div>
                                {statusSaving && (
                                    <p className="text-xs text-muted-foreground pb-2 italic">Updating…</p>
                                )}
                            </div>

                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-8">

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <SectionHeading>Basic Information</SectionHeading>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="space-y-4">
                        <SectionHeading>Employment Details</SectionHeading>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                label="Timezone"
                                value={employee.timezone ?? 'UTC'}
                                onChangeAction={(v) => setEmployee({ ...employee, timezone: v })}
                            >
                                {TIMEZONE_OPTIONS.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                ))}
                            </RequiredSelect>

                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <AsyncSearchSelect
                                        label="Org Unit"
                                        value={employee.orgUnitId}
                                        onChangeAction={async (value) => {
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

                    {/* Address */}
                    <div className="space-y-4">
                        <SectionHeading>Address</SectionHeading>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <Separator />

                    {/* Personal Profile */}
                    <div className="space-y-4">
                        <SectionHeading>Personal Information</SectionHeading>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    {/* System Access */}
                    <div className="space-y-4">
                        <SectionHeading>System Access</SectionHeading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <p className="text-[10px] text-muted-foreground italic">
                                    {isSystemAdmin 
                                        ? "Determines the user's permission level in the system."
                                        : "Only System Administrators can modify roles."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Government IDs */}
                    <div className="space-y-4">
                        <SectionHeading>Government IDs</SectionHeading>
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
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

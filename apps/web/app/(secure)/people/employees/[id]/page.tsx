'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequiredInput } from '@/components/ui/required-input'
import { RequiredSelect } from '@/components/ui/required-select'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api'
import { AsyncSearchSelect } from '@/components/ui/async-search-select'
import { SelectItem } from '@/components/ui/select'

interface OrgUnitOption {
    id: string
    name: string
    code?: string
    path?: string
}

interface PositionOption {
    id: string
    title: string
}

interface SupervisorOption {
    id: string
    firstName: string
    lastName: string
}

interface StatusOptionsResponse {
    current: string
    allowedNext: string[]
}

interface Employee {
    id: string
    employeeNo: string
    firstName: string
    lastName: string
    middleName?: string | null
    alternateEmail?: string | null
    email?: string | null
    hireDate: string
    employmentType: string
    status: string
    orgUnitId: string
    positionId: string
    supervisorId?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    countryCode?: string | null
}

type OrgUnitSearchResponse = OrgUnitOption[] | { data: OrgUnitOption[] }

function isOrgUnitArray(value: unknown): value is OrgUnitOption[] {
    return Array.isArray(value)
}

function isOrgUnitDataWrapper(value: unknown): value is { data: OrgUnitOption[] } {
    return (
        typeof value === 'object' &&
        value !== null &&
        'data' in value &&
        Array.isArray((value as { data: unknown }).data)
    )
}

function unwrapOrgUnitSearch(value: OrgUnitSearchResponse | unknown): OrgUnitOption[] {
    if (isOrgUnitArray(value)) return value
    if (isOrgUnitDataWrapper(value)) return value.data
    return []
}

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

    useEffect(() => {
        async function fetchEmployee() {
            try {
                const data = await apiFetch<Employee>(`/employees/${id}`)
                setEmployee(data)
                setOriginalStatus(data.status)
                try {
                    const statusOptions = await apiFetch<StatusOptionsResponse>(
                        `/employees/${id}/status/options`,
                    )
                    setAllowedNextStatuses(statusOptions.allowedNext)
                } catch {
                    // If endpoint is unavailable, fall back to showing all statuses.
                    setAllowedNextStatuses([])
                }
                // Fetch current org unit so the current selection can render.
                const currentOrg = await apiFetch<OrgUnitOption>(`/org-units/${data.orgUnitId}`)
                setCurrentOrgUnit(currentOrg)

                const positionsData = await apiFetch<PositionOption[]>(
                    `/org-units/${data.orgUnitId}/positions`
                )
                setPositions(positionsData)
                if (positionsData.length > 0 && !positionsData.some((p) => p.id === data.positionId)) {
                    setEmployee({ ...data, positionId: positionsData[0]!.id })
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchEmployee()
    }, [id])


    function validateEmployee(e: Employee, availablePositions: PositionOption[]): Record<string, string> {
        const errors: Record<string, string> = {}

        const email = (e.email ?? '').trim()
        if (!email) errors.email = 'Login Email is required'

        if (!e.firstName.trim()) errors.firstName = 'First Name is required'
        if (!e.lastName.trim()) errors.lastName = 'Last Name is required'

        if (!e.hireDate.trim()) errors.hireDate = 'Hire Date is required'
        if (!e.employmentType.trim()) errors.employmentType = 'Employment Type is required'

        if (!e.orgUnitId.trim()) errors.orgUnitId = 'Org Unit is required'
        if (!e.positionId.trim()) errors.positionId = 'Position is required'

        if (availablePositions.length > 0 && e.positionId.trim()) {
            const ok = availablePositions.some((p) => p.id === e.positionId)
            if (!ok) errors.positionId = 'Position is not allowed in the specified org unit'
        }

        return errors
    }

    async function handleSave() {
        if (!employee) return

        setFormError(null)
        setFieldErrors({})
        setSaving(true)
        try {
            const errors = validateEmployee(employee, positions)
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors)
                setFormError('Please fix the highlighted fields.')
                setSaving(false)
                return
            }
            // Build update payload (exclude immutable/system fields)
            const updatePayload = {
                firstName: employee.firstName,
                lastName: employee.lastName,
                middleName: employee.middleName ?? null,
                alternateEmail: employee.alternateEmail ?? null,
                email: employee.email && employee.email.trim().length > 0
                    ? employee.email.trim()
                    : undefined,
                hireDate: employee.hireDate,
                employmentType: employee.employmentType,
                orgUnitId: employee.orgUnitId,
                positionId: employee.positionId,
                supervisorId: employee.supervisorId ?? null,
                addressLine1: employee.addressLine1 ?? null,
                addressLine2: employee.addressLine2 ?? null,
                city: employee.city ?? null,
                province: employee.province ?? null,
                postalCode: employee.postalCode ?? null,
                countryCode: employee.countryCode ?? null,
            }

            await apiFetch(`/employees/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updatePayload),
            })

            router.refresh()
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-6">Loading...</div>
    if (!employee) return <div className="p-6">Employee not found</div>

    return (
        <div className="p-6 space-y-6">
            {formError && (
                <div className="text-sm text-red-600">{formError}</div>
            )}

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
                        onChangeAction={async (value) => {
                            if (value === employee.status) return

                            setStatusSaving(true)
                            try {
                                // optimistic UI
                                setEmployee((prev) => (prev ? { ...prev, status: value } : prev))

                                await apiFetch(`/employees/${id}/status`, {
                                    method: 'POST',
                                    body: JSON.stringify({ status: value }),
                                })

                                setOriginalStatus(value)

                                try {
                                    const statusOptions = await apiFetch<StatusOptionsResponse>(
                                        `/employees/${id}/status/options`,
                                    )
                                    setAllowedNextStatuses(statusOptions.allowedNext)
                                } catch {
                                    setAllowedNextStatuses([])
                                }
                            } catch (err) {
                                console.error(err)
                                // revert on failure
                                setEmployee((prev) =>
                                    prev ? { ...prev, status: originalStatus ?? prev.status } : prev,
                                )

                                try {
                                    const statusOptions = await apiFetch<StatusOptionsResponse>(
                                        `/employees/${id}/status/options`,
                                    )
                                    setAllowedNextStatuses(statusOptions.allowedNext)
                                } catch {
                                    setAllowedNextStatuses([])
                                }
                            } finally {
                                setStatusSaving(false)
                            }
                        }}
                    >
                        {(() => {
                            const all: Array<{ value: string; label: string }> = [
                                { value: 'ACTIVE', label: 'Active' },
                                { value: 'PROBATION', label: 'Probation' },
                                { value: 'SUSPENDED', label: 'Suspended' },
                                { value: 'RESIGNED', label: 'Resigned' },
                                { value: 'TERMINATED', label: 'Terminated' },
                            ]

                            // If we have transition options, only allow current + allowedNext.
                            const allowSet =
                                allowedNextStatuses.length > 0
                                    ? new Set<string>([employee.status, ...allowedNextStatuses])
                                    : null

                            const filtered = allowSet
                                ? all.filter((s) => allowSet.has(s.value))
                                : all

                            return filtered.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))
                        })()}
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
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, email: value })
                            }
                        />

                        <RequiredInput
                            label="First Name"
                            value={employee.firstName}
                            required
                            touched={!!fieldErrors.firstName}
                            errorMessage={fieldErrors.firstName}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, firstName: value })
                            }
                        />

                        <RequiredInput
                            label="Last Name"
                            value={employee.lastName}
                            required
                            touched={!!fieldErrors.lastName}
                            errorMessage={fieldErrors.lastName}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, lastName: value })
                            }
                        />

                        <RequiredInput
                            label="Middle Name"
                            value={employee.middleName ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, middleName: value })
                            }
                        />

                        <RequiredInput
                            label="Alternate Email"
                            value={employee.alternateEmail ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, alternateEmail: value })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <RequiredInput
                            label="Hire Date"
                            value={employee.hireDate}
                            required
                            touched={!!fieldErrors.hireDate}
                            errorMessage={fieldErrors.hireDate}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, hireDate: value })
                            }
                            className="[&_input]:type-date"
                        />

                        <RequiredSelect
                            label="Employment Type"
                            value={employee.employmentType}
                            required
                            touched={!!fieldErrors.employmentType}
                            errorMessage={fieldErrors.employmentType}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, employmentType: value })
                            }
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

                                // update org unit immediately
                                setEmployee((prev) => (prev ? { ...prev, orgUnitId: value } : prev))

                                // Keep the current org unit cached for label rendering
                                try {
                                    const currentOrg = await apiFetch<OrgUnitOption>(`/org-units/${value}`)
                                    setCurrentOrgUnit(currentOrg)
                                } catch {
                                    setCurrentOrgUnit(null)
                                }

                                const positionsData = await apiFetch<PositionOption[]>(`/org-units/${value}/positions`)
                                setPositions(positionsData)

                                // default position to first available (or clear if none)
                                setEmployee((prev) =>
                                    prev
                                        ? { ...prev, positionId: positionsData[0]?.id ?? '' }
                                        : prev
                                )
                            }}
                            fetchOptions={async (search) => {
                                // Use the new searchable endpoint (leaf nodes by default)
                                const res = await apiFetch<OrgUnitSearchResponse>(
                                    `/org-units/search?leavesOnly=true&showDeleted=false&pageSize=20&limit=20&search=${encodeURIComponent(search)}`
                                )

                                const list = unwrapOrgUnitSearch(res)

                                // Ensure the current org unit is included so the current label can render
                                if (currentOrgUnit && !list.some((ou) => ou.id === currentOrgUnit.id)) {
                                    return [currentOrgUnit, ...list]
                                }

                                return list
                            }}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) => {
                                const base = o.path && o.path.trim().length > 0 ? o.path : o.name
                                return o.code && o.code.trim().length > 0 ? `${base} (${o.code})` : base
                            }}
                            placeholder="Search org unit..."
                        />

                        <RequiredSelect
                            label="Position"
                            value={employee.positionId || ''}
                            required
                            touched={!!fieldErrors.positionId}
                            errorMessage={fieldErrors.positionId}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, positionId: value })
                            }
                        >
                            {positions.map((pos) => (
                                <SelectItem key={pos.id} value={pos.id}>
                                    {pos.title}
                                </SelectItem>
                            ))}
                        </RequiredSelect>

                        <AsyncSearchSelect
                            label="Supervisor"
                            value={employee.supervisorId}
                            onChange={(value) =>
                                setEmployee({ ...employee, supervisorId: value })
                            }
                            fetchOptions={async (search) => {
                                const res = await apiFetch<{ data: SupervisorOption[] }>(
                                    `/employees?status=ACTIVE&status=ACTIVE&search=${encodeURIComponent(search)}&pageSize=20`
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
                        <RequiredInput
                            label="Address Line 1"
                            value={employee.addressLine1 ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, addressLine1: value })
                            }
                        />

                        <RequiredInput
                            label="Address Line 2"
                            value={employee.addressLine2 ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, addressLine2: value })
                            }
                        />

                        <RequiredInput
                            label="City"
                            value={employee.city ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, city: value })
                            }
                        />

                        <RequiredInput
                            label="Province"
                            value={employee.province ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, province: value })
                            }
                        />

                        <RequiredInput
                            label="Postal Code"
                            value={employee.postalCode ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, postalCode: value })
                            }
                        />

                        <RequiredInput
                            label="Country Code"
                            value={employee.countryCode ?? ''}
                            onChangeAction={(value) =>
                                setEmployee({ ...employee, countryCode: value })
                            }
                        />
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

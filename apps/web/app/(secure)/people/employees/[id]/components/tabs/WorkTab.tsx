'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequiredInput } from '@/components/ui/required-input'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AsyncSearchSelect } from '@/components/ui/async-search-select'
import { Employee, SupervisorOption } from '@/types/employee.type'
import { OrgUnitOption } from '@/types/org-unit.type'
import { PositionOption } from '@/types/position.types'
import { LeavePolicy } from '@/types/leave.types'
import { Role } from '@/lib/auth-types'
import { isEmploymentType } from '@hybrid-hris/domain'
import { TIMEZONE_OPTIONS } from '@/lib/employee.enum'
import { SectionHeading } from '../../../helpers'
import { apiFetch } from '@/lib/api'
import { DEFAULT_IDENTIFIERS } from '../../../config'

interface WorkTabProps {
    employee: Employee;
    setEmployee: (update: Employee | null | ((prev: Employee | null) => Employee | null)) => void;
    fieldErrors: Record<string, string>;
    isSystemAdmin: boolean;
    roles: Role[];
    currentRoleName: string;
    jobLevels: { id: string; code: string; name: string; }[];
    policies: LeavePolicy[];
    positions: PositionOption[];
    fetchOrgUnits: (search: string) => Promise<OrgUnitOption[]>;
    setCurrentOrgUnit: (org: OrgUnitOption | null) => void;
    setPositions: (positions: PositionOption[]) => void;
    fetchSupervisors: (search: string) => Promise<SupervisorOption[]>;
    handleSave: () => void;
    saving: boolean;
}

export function WorkTab({
    employee,
    setEmployee,
    fieldErrors,
    isSystemAdmin,
    roles,
    currentRoleName,
    jobLevels,
    policies,
    positions,
    fetchOrgUnits,
    setCurrentOrgUnit,
    setPositions,
    fetchSupervisors,
    handleSave,
    saving,
}: WorkTabProps) {
    return (
        <Card className="shadow-sm border-muted/60">
            <CardContent className="pt-8 space-y-10">
                {/* Basic Information */}
                <div className="space-y-6">
                    <SectionHeading>Basic Information</SectionHeading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <RequiredInput label="Employee No" value={employee.employeeNo} onChangeAction={() => { }} disabled />
                        <RequiredInput
                            label="Login Email"
                            value={employee.email ?? ''}
                            required
                            touched={!!fieldErrors.email}
                            errorMessage={fieldErrors.email}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, email: v }) : null)}
                        />
                        <RequiredInput
                            label="Alternate Email"
                            value={employee.alternateEmail ?? ''}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, alternateEmail: v }) : null)}
                        />
                        <RequiredInput
                            label="First Name"
                            value={employee.firstName}
                            required
                            touched={!!fieldErrors.firstName}
                            errorMessage={fieldErrors.firstName}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, firstName: v }) : null)}
                        />
                        <RequiredInput
                            label="Last Name"
                            value={employee.lastName}
                            required
                            touched={!!fieldErrors.lastName}
                            errorMessage={fieldErrors.lastName}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, lastName: v }) : null)}
                        />
                        <RequiredInput
                            label="Middle Name"
                            value={employee.middleName ?? ''}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, middleName: v }) : null)}
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
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, hireDate: v }) : null)}
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
                                if (isEmploymentType(v)) setEmployee((prev) => prev ? ({ ...prev, employmentType: v }) : null)
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
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, jobLevelId: v === 'none' ? null : v }) : null)}
                        >
                            <SelectItem value="none">Not Assigned</SelectItem>
                            {jobLevels.map((l) => (
                                <SelectItem key={l.id} value={l.id}>{l.name} ({l.code})</SelectItem>
                            ))}
                        </RequiredSelect>
                        <RequiredSelect
                            label="Timezone"
                            value={employee.timezone ?? 'UTC'}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, timezone: v }) : null)}
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
                                        setEmployee((prev) => prev ? ({ ...prev, orgUnitId: value }) : null)
                                        try {
                                            const ou = await apiFetch<OrgUnitOption>(`/org-units/${value}`)
                                            setCurrentOrgUnit(ou)
                                        } catch (err) {
                                            console.error(err)
                                            setCurrentOrgUnit(null)
                                        }
                                        const positionsData = await apiFetch<PositionOption[]>(`/org-units/${value}/positions`)
                                        setPositions(positionsData)
                                        setEmployee((prev) => prev ? ({ ...prev, positionId: positionsData[0]?.id ?? '' }) : null)
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
                                    onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, positionId: v }) : null)}
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
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, supervisorId: v }) : null)}
                            fetchOptions={fetchSupervisors}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                            excludeIds={[employee.id]}
                            placeholder="Search supervisor..."
                        />
                        <RequiredSelect
                            label="Leave Policy"
                            value={employee.policyId ?? 'none'}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, policyId: v === 'none' ? null : v }) : null)}
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
                                        const roleIds = v === 'none' ? [] : [v];
                                        setEmployee((prev) => prev ? ({ ...prev, roleIds }) : null)
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
                                <RequiredInput label="System Role" value={currentRoleName} onChangeAction={() => { }} disabled />
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
                                    setEmployee((prev) => prev ? ({
                                        ...prev,
                                        identifiers: { ...(prev.identifiers ?? { ...DEFAULT_IDENTIFIERS, employeeId: prev.id }), [field]: v },
                                    }) : null)
                                }
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} className="font-semibold min-w-[140px]">
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

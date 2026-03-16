'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequiredInput } from '@/components/ui/required-input'
import { PhoneInput } from '@/components/ui/phone-input'
import { LandlineInput } from '@/components/ui/landline-input'
import { BirthdayPickerField } from '@/components/ui/birthday-picker-field'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Employee } from '@/types/employee.type'
import { isGender, isCivilStatus, isPayrollType } from '@hybrid-hris/domain'
import { SectionHeading } from '../../../helpers'
import { COUNTRY_OPTIONS } from '@/lib/employee.enum'
import { Label } from '@/components/ui/label'
import { DEFAULT_PROFILE } from '../../../config'

interface PersonalTabProps {
    employee: Employee;
    setEmployee: (update: Employee | null | ((prev: Employee | null) => Employee | null)) => void;
    fieldErrors: Record<string, string>;
    handleSave: () => void;
    saving: boolean;
}

export function PersonalTab({
    employee,
    setEmployee,
    fieldErrors,
    handleSave,
    saving,
}: PersonalTabProps) {
    return (
        <Card className="shadow-sm border-muted/60">
            <CardContent className="pt-8 space-y-10">
                {/* Personal Profile */}
                <div className="space-y-6">
                    <SectionHeading>Demographics & Contacts</SectionHeading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <BirthdayPickerField
                            value={employee.profile?.birthDate}
                            onChangeAction={(v) =>
                                setEmployee((prev) => prev ? ({
                                    ...prev,
                                    profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), birthDate: v },
                                }) : null)
                            }
                        />
                        <RequiredSelect
                            label="Gender"
                            value={employee.profile?.gender ?? ''}
                            onChangeAction={(v) => {
                                if (isGender(v)) setEmployee((prev) => prev ? ({ ...prev, profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), gender: v } }) : null)
                            }}
                        >
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                        </RequiredSelect>
                        <RequiredSelect
                            label="Civil Status"
                            value={employee.profile?.civilStatus ?? ''}
                            onChangeAction={(v) => {
                                if (isCivilStatus(v)) setEmployee((prev) => prev ? ({ ...prev, profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), civilStatus: v } }) : null)
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
                                setEmployee((prev) => prev ? ({
                                    ...prev,
                                    profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), [field]: v },
                                }) : null);

                            if (isMobile) {
                                return (
                                    <div key={field} className="space-y-1 text-foreground">
                                        <Label>{label}</Label>
                                        <PhoneInput value={val} error={!!fieldErrors[field]} onChangeAction={onChange} />
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
                                        <LandlineInput value={val} error={!!fieldErrors[field]} onChangeAction={onChange} />
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
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, addressLine1: v }) : null)}
                        />
                        <RequiredInput
                            label="Address Line 2"
                            value={employee.addressLine2 ?? ''}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, addressLine2: v }) : null)}
                        />
                        <RequiredInput
                            label="City"
                            value={employee.city ?? ''}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, city: v }) : null)}
                        />
                        <RequiredInput
                            label="Province"
                            value={employee.province ?? ''}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, province: v }) : null)}
                        />
                        <RequiredInput
                            label="Postal Code"
                            value={employee.postalCode ?? ''}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, postalCode: v }) : null)}
                        />
                        <RequiredSelect
                            label="Country Code"
                            value={employee.countryCode ?? 'PH'}
                            onChangeAction={(v) => setEmployee((prev) => prev ? ({ ...prev, countryCode: v }) : null)}
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

                {/* Payroll Settings */}
                <div className="space-y-6">
                    <SectionHeading>Payroll Settings</SectionHeading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RequiredSelect
                            label="Payroll Cycle Type"
                            value={employee.profile?.payrollType ?? 'MONTHLY'}
                            onChangeAction={(v) => {
                                if (isPayrollType(v)) {
                                    setEmployee((prev) => prev ? ({ ...prev, profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id }), payrollType: v } }) : null)
                                }
                            }}
                        >
                            <SelectItem value="MONTHLY">Monthly (Fixed)</SelectItem>
                            <SelectItem value="DAILY">Daily (No Work No Pay)</SelectItem>
                        </RequiredSelect>

                        <div className="space-y-1 text-foreground">
                            <Label>Factor Rate (DOLE Divisor)</Label>
                            <RequiredInput
                                label=""
                                value={employee.profile?.factorRate?.toString() ?? '261'}
                                placeholder="e.g. 261, 313, 365"
                                touched={!!fieldErrors['factorRate']}
                                errorMessage={fieldErrors['factorRate']}
                                onChangeAction={(v) => {
                                    setEmployee((prev) => prev ? ({ ...prev, profile: { ...(prev.profile ?? { ...DEFAULT_PROFILE, employeeId: prev.id, factorRate: '261', payrollType: 'MONTHLY' }), factorRate: v } }) : null)
                                }}
                            />
                        </div>
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

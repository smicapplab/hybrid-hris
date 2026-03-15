'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PhoneInput, isValidPHMobile, cleanPhoneNumber } from '@/components/ui/phone-input'
import { LandlineInput, isValidPHLandline, cleanLandline } from '@/components/ui/landline-input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { BirthdayPickerField } from '@/components/ui/birthday-picker-field'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { CIVIL_STATUS_OPTIONS, COUNTRY_OPTIONS, GENDER_OPTIONS, NATIONALITY_OPTIONS } from '@/lib/employee.enum'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User as UserIcon, GraduationCap } from 'lucide-react'
import { MySkillsTab } from './components/my-skills-tab'


/* ─── Types ───────────────────────────────────────────────────────────────── */

type ProfileData = {
    email: string
    employeeNo: string
    firstName: string
    lastName: string
    middleName: string | null
    alternateEmail: string | null
    addressLine1: string | null
    addressLine2: string | null
    city: string | null
    province: string | null
    postalCode: string | null
    countryCode: string
    birthDate: string | null
    gender: string | null
    civilStatus: string | null
    nationality: string | null
    personalEmail: string | null
    mobileNo: string | null
    landlineNo: string | null
    emergencyContactName: string | null
    emergencyContactRelationship: string | null
    emergencyContactMobileNo: string | null
}

type FormState = {
    [K in keyof Omit<ProfileData, 'email' | 'employeeNo' | 'firstName' | 'lastName' | 'middleName'>]: string
}

function toForm(p: ProfileData): FormState {
    return {
        alternateEmail: p.alternateEmail ?? '',
        addressLine1: p.addressLine1 ?? '',
        addressLine2: p.addressLine2 ?? '',
        city: p.city ?? '',
        province: p.province ?? '',
        postalCode: p.postalCode ?? '',
        countryCode: p.countryCode ?? 'PH',
        birthDate: p.birthDate ?? '',
        gender: p.gender ?? '',
        civilStatus: p.civilStatus ?? '',
        nationality: p.nationality ?? '',
        personalEmail: p.personalEmail ?? '',
        mobileNo: p.mobileNo ?? '',
        landlineNo: p.landlineNo ?? '',
        emergencyContactName: p.emergencyContactName ?? '',
        emergencyContactRelationship: p.emergencyContactRelationship ?? '',
        emergencyContactMobileNo: p.emergencyContactMobileNo ?? '',
    }
}

/* ─── Small helpers ───────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {children}
        </h3>
    )
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value || '—'}</span>
        </div>
    )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function MyProfilePage() {
    const { toast } = useToast()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [form, setForm] = useState<FormState | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        apiFetch<ProfileData>('/profile/me')
            .then((data) => {
                setProfile(data)
                setForm(toForm(data))
            })
            .catch((err: Error) => {
                toast({
                    title: 'Failed to load profile',
                    description: err.message,
                    variant: 'destructive',
                })
            })
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function set(key: keyof FormState, value: string) {
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    }

    async function handleSave() {
        if (!form) return

        // ── Validation ──
        const errors: Record<string, string> = {}
        if (form.mobileNo && !isValidPHMobile(form.mobileNo)) {
            errors.mobileNo = 'Invalid mobile number format'
        }
        if (form.emergencyContactMobileNo && !isValidPHMobile(form.emergencyContactMobileNo)) {
            errors.emergencyContactMobileNo = 'Invalid mobile number format'
        }
        if (form.landlineNo && !isValidPHLandline(form.landlineNo)) {
            errors.landlineNo = 'Invalid landline number format'
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            toast({
                title: 'Validation Error',
                description: 'Please fix the number format.',
                variant: 'destructive',
            })
            return
        }

        setFieldErrors({})
        setSaving(true)
        try {
            // Omit keys with empty string — don't blank-out existing values unintentionally
            const payload: Record<string, string> = {}
            for (const [k, v] of Object.entries(form)) {
                let cleanVal = v as string
                if (k === 'mobileNo' || k === 'emergencyContactMobileNo') {
                    cleanVal = cleanPhoneNumber(cleanVal)
                }
                if (k === 'landlineNo') {
                    cleanVal = cleanLandline(cleanVal)
                }
                if (cleanVal !== '') payload[k] = cleanVal
            }
            const updated = await apiFetch<ProfileData>('/profile/me', {
                method: 'PATCH',
                body: JSON.stringify(payload),
            })
            setProfile(updated)
            setForm(toForm(updated))
            toast({ title: 'Profile updated', variant: 'success' })
        } catch (err: unknown) {
            toast({
                title: 'Update failed',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Loading profile…</p>
                </CardContent>
            </Card>
        )
    }

    if (!profile || !form) return null

    const fullName = [profile.firstName, profile.middleName, profile.lastName]
        .filter(Boolean)
        .join(' ')

    return (
        <div className="p-6 space-y-6 max-w-6xl">
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-100 bg-muted/50 rounded-lg border">
                    <TabsTrigger value="personal" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <UserIcon className="w-4 h-4" /> Personal Information
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <GraduationCap className="w-4 h-4" /> My Skills
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-6 space-y-4">
                    <Card>
                        <CardContent className="p-6 space-y-8 text-foreground">
                            {/* ── Identity (read-only) ── */}
                            <div className="space-y-3">
                                <SectionTitle>Identity</SectionTitle>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                                    <div className="col-span-2">
                                        <ReadOnlyField label="Full Name" value={fullName} />
                                    </div>
                                    <ReadOnlyField label="Employee No." value={profile.employeeNo} />
                                    <ReadOnlyField label="Work Email" value={profile.email} />
                                </div>
                            </div>

                            <Separator />

                            {/* ── Demographics ── */}
                            <div className="space-y-4">
                                <SectionTitle>Demographics</SectionTitle>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                    <Field>
                                        <FieldLabel>Date of Birth</FieldLabel>
                                        <BirthdayPickerField
                                            value={form.birthDate || null}
                                            onChangeAction={(v) => set('birthDate', v)}
                                            label=""
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel>Gender</FieldLabel>
                                        <Select
                                            value={form.gender}
                                            onValueChange={(v) => set('gender', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GENDER_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field>
                                        <FieldLabel>Civil Status</FieldLabel>
                                        <Select
                                            value={form.civilStatus}
                                            onValueChange={(v) => set('civilStatus', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select civil status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CIVIL_STATUS_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field>
                                        <FieldLabel>Nationality</FieldLabel>
                                        <Select
                                            value={form.nationality}
                                            onValueChange={(v) => set('nationality', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select nationality" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {NATIONALITY_OPTIONS.map((n) => (
                                                    <SelectItem key={n} value={n}>
                                                        {n}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                </div>
                            </div>

                            <Separator />

                            {/* ── Contact ── */}
                            <div className="space-y-4">
                                <SectionTitle>Contact Information</SectionTitle>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                    <Field>
                                        <FieldLabel htmlFor="mobileNo">Mobile Number</FieldLabel>
                                        <PhoneInput
                                            id="mobileNo"
                                            value={form.mobileNo}
                                            error={!!fieldErrors.mobileNo}
                                            onChangeAction={(v) => set('mobileNo', v)}
                                        />
                                        {fieldErrors.mobileNo && (
                                            <p className="text-[10px] text-destructive font-medium uppercase tracking-tight mt-1">{fieldErrors.mobileNo}</p>
                                        )}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="landlineNo">Landline Number</FieldLabel>
                                        <LandlineInput
                                            id="landlineNo"
                                            value={form.landlineNo}
                                            error={!!fieldErrors.landlineNo}
                                            onChangeAction={(v) => set('landlineNo', v)}
                                        />
                                        {fieldErrors.landlineNo && (
                                            <p className="text-[10px] text-destructive font-medium uppercase tracking-tight mt-1">{fieldErrors.landlineNo}</p>
                                        )}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="personalEmail">Personal Email</FieldLabel>
                                        <Input
                                            id="personalEmail"
                                            type="email"
                                            value={form.personalEmail}
                                            placeholder="your@personal.email"
                                            onChange={(e) => set('personalEmail', e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="alternateEmail">Alternate Email</FieldLabel>
                                        <Input
                                            id="alternateEmail"
                                            type="email"
                                            value={form.alternateEmail}
                                            placeholder="alternate@email.com"
                                            onChange={(e) => set('alternateEmail', e.target.value)}
                                        />
                                    </Field>

                                </div>
                            </div>

                            <Separator />

                            {/* ── Emergency Contact ── */}
                            <div className="space-y-4">
                                <SectionTitle>Emergency Contact</SectionTitle>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                    <Field>
                                        <FieldLabel htmlFor="ecName">Full Name</FieldLabel>
                                        <Input
                                            id="ecName"
                                            value={form.emergencyContactName}
                                            placeholder="Contact name"
                                            onChange={(e) => set('emergencyContactName', e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="ecRel">Relationship</FieldLabel>
                                        <Input
                                            id="ecRel"
                                            value={form.emergencyContactRelationship}
                                            placeholder="e.g. Spouse, Parent, Sibling"
                                            onChange={(e) => set('emergencyContactRelationship', e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="ecMobile">Mobile Number</FieldLabel>
                                        <PhoneInput
                                            id="ecMobile"
                                            value={form.emergencyContactMobileNo}
                                            error={!!fieldErrors.emergencyContactMobileNo}
                                            onChangeAction={(v) => set('emergencyContactMobileNo', v)}
                                        />
                                        {fieldErrors.emergencyContactMobileNo && (
                                            <p className="text-[10px] text-destructive font-medium uppercase tracking-tight mt-1">{fieldErrors.emergencyContactMobileNo}</p>
                                        )}
                                    </Field>

                                </div>
                            </div>

                            <Separator />

                            {/* ── Address ── */}
                            <div className="space-y-4">
                                <SectionTitle>Address</SectionTitle>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                    <Field className="sm:col-span-2">
                                        <FieldLabel htmlFor="addr1">Address Line 1</FieldLabel>
                                        <Input
                                            id="addr1"
                                            value={form.addressLine1}
                                            placeholder="House / Unit no., Street, Barangay"
                                            onChange={(e) => set('addressLine1', e.target.value)}
                                        />
                                    </Field>

                                    <Field className="sm:col-span-2">
                                        <FieldLabel htmlFor="addr2">Address Line 2 (optional)</FieldLabel>
                                        <Input
                                            id="addr2"
                                            value={form.addressLine2}
                                            placeholder="Subdivision, Purok"
                                            onChange={(e) => set('addressLine2', e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="city">City / Municipality</FieldLabel>
                                        <Input
                                            id="city"
                                            value={form.city}
                                            onChange={(e) => set('city', e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="province">Province / State</FieldLabel>
                                        <Input
                                            id="province"
                                            value={form.province}
                                            onChange={(e) => set('province', e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="postal">Postal Code</FieldLabel>
                                        <Input
                                            id="postal"
                                            value={form.postalCode}
                                            onChange={(e) => set('postalCode', e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel>Country</FieldLabel>
                                        <Select
                                            value={form.countryCode}
                                            onValueChange={(v) => set('countryCode', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {COUNTRY_OPTIONS.map((c) => (
                                                    <SelectItem key={c.code} value={c.code}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                </div>
                            </div>

                            <Separator />

                            {/* ── Save ── */}
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="skills" className="mt-6">
                    <MySkillsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}

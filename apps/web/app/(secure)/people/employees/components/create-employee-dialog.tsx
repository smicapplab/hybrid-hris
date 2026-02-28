'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RequiredInput } from '@/components/ui/required-input'
import { RequiredSelect } from '@/components/ui/required-select'
import { SelectItem } from '@/components/ui/select'
import { AsyncSearchSelect } from '@/components/ui/async-search-select'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api'
import type { OrgUnitOption } from '@/types/org-unit.type'
import type { PositionOption } from '@/types/position.types'
import type { SupervisorOption } from '@/types/employee.type'

// ── Types ─────────────────────────────────────────────────────────────────────

type HrConfig = {
    emailDomain: string | null
}

type PasswordMode = 'auto' | 'manual'

type Form = {
    firstName: string
    middleName: string
    lastName: string
    // Email — two modes depending on whether HR has configured a domain
    username: string        // used when emailDomain is set; login = username@domain
    email: string           // used when emailDomain is null; full address
    alternateEmail: string  // optional notification email (where credentials are sent)
    passwordMode: PasswordMode
    password: string        // always sent; generated client-side in 'auto' mode
    orgUnitId: string
    positionId: string
    supervisorId: string | null
    hireDate: string
}

type FieldErrors = Partial<Record<keyof Form, string>>

type Props = {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM: Form = {
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    alternateEmail: '',
    passwordMode: 'auto',
    password: '',
    orgUnitId: '',
    positionId: '',
    supervisorId: null,
    hireDate: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveUsername(firstName: string, lastName: string): string {
    const first = firstName.trim().charAt(0).toLowerCase()
    const last = lastName.trim().toLowerCase().replace(/\s+/g, '')
    return first + last
}

// Generate a secure random password client-side (16 URL-safe chars, ~96 bits)
// so the HR admin can see and copy it before sharing credentials.
function generatePassword(): string {
    const bytes = new Uint8Array(12)
    crypto.getRandomValues(bytes)
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

// ── Password rules ────────────────────────────────────────────────────────────

// Top ~100 most frequently seen passwords from public breach data
const COMMON_PASSWORDS = new Set([
    'password', '123456', '12345678', 'qwerty', 'abc123', 'password1',
    'iloveyou', 'admin', 'letmein', 'monkey', '1234567', 'sunshine',
    'princess', 'master', 'shadow', 'dragon', '123456789', '1234567890',
    'baseball', 'football', 'soccer', 'charlie', 'donald', 'batman',
    'trustno1', 'hello', 'welcome', 'michael', 'superman', 'jessica',
    '654321', '000000', 'qwerty123', 'pass', 'login', '111111', '12345',
    '1234', 'pass123', 'passw0rd', 'password12', 'changeme', 'secret',
    'matrix', 'computer', 'internet', 'mustang', 'access', 'ninja',
    'ranger', 'maverick', 'buster', 'tigger', 'smokey', 'golfer',
    'summer', 'winter', 'spring', 'flower', 'cookie', 'maggie', 'hockey',
    'dallas', 'harley', 'hunter', 'joshua', 'thomas', 'andrew', 'robert',
    'george', 'jordan', 'snoopy', 'garfield', 'pepper', 'ginger', 'coffee',
    'chocolate', 'pokemon', 'naruto', 'cheese', 'test123', 'admin123',
    'user123', 'abcdef', '1q2w3e4r', 'zxcvbnm', 'qwertyuiop', 'asdfghjkl',
    'password2', 'password3', 'spiderman', 'starwars', 'hello123', '123123',
    'p@ssword', 'pa$$word', 'p@ssw0rd', 'monkey1', 'love1234', 'test',
    'abc1234', 'test1234', 'superman1', 'iloveyou1', 'asd123', 'pass1234',
])

type RuleResult = { label: string; passed: boolean }

function evaluatePasswordRules(password: string, loginEmail: string): RuleResult[] {
    const pw = password
    const pwLower = pw.toLowerCase()
    // Extract the local part of the email (before @) for the contains-check
    const emailLocal = loginEmail.split('@')[0].toLowerCase()

    return [
        {
            label: 'At least 8 characters',
            passed: pw.length >= 8,
        },
        {
            label: 'Not a commonly used password',
            passed: !COMMON_PASSWORDS.has(pwLower),
        },
        {
            // Only meaningful if we have a non-trivial local part
            label: 'Does not contain your email address',
            passed: emailLocal.length < 3 || !pwLower.includes(emailLocal),
        },
    ]
}

function validate(form: Form, emailDomain: string | null): FieldErrors {
    const errors: FieldErrors = {}

    if (!form.firstName.trim()) errors.firstName = 'Required'
    if (!form.lastName.trim()) errors.lastName = 'Required'

    if (emailDomain) {
        if (!form.username.trim()) {
            errors.username = 'Required'
        } else if (!/^[a-z0-9._-]+$/.test(form.username)) {
            errors.username = 'Lowercase letters, digits, dots, hyphens only'
        }
    } else {
        if (!form.email.trim()) {
            errors.email = 'Required'
        } else if (!form.email.includes('@')) {
            errors.email = 'Must be a valid email'
        }
    }

    if (form.alternateEmail.trim() && !form.alternateEmail.includes('@')) {
        errors.alternateEmail = 'Must be a valid email'
    }

    if (!form.password) {
        errors.password = 'Required'
    } else {
        const loginEmailForCheck = emailDomain
            ? `${form.username.trim()}@${emailDomain}`
            : form.email.trim()
        const failedRules = evaluatePasswordRules(form.password, loginEmailForCheck).filter((r) => !r.passed)
        if (failedRules.length > 0) {
            errors.password = 'Password doesn\u2019t meet all requirements'
        }
    }

    if (!form.orgUnitId) errors.orgUnitId = 'Required'
    if (!form.positionId) errors.positionId = 'Required'
    if (!form.hireDate) errors.hireDate = 'Required'

    return errors
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateEmployeeDialog({ open, onOpenChangeAction }: Props) {
    const router = useRouter()

    const [form, setForm] = useState<Form>(EMPTY_FORM)
    const [hrConfig, setHrConfig] = useState<HrConfig | null>(null)
    const [usernameAutoSet, setUsernameAutoSet] = useState(true)
    const [copied, setCopied] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [positions, setPositions] = useState<PositionOption[]>([])
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitOption | null>(null)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    const [formError, setFormError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // On open: fetch HR config + seed an auto-generated password.
    // On close: reset everything.
    useEffect(() => {
        if (open) {
            setForm((prev) => ({ ...prev, password: generatePassword() }))
            apiFetch<HrConfig>('/employees/config')
                .then(setHrConfig)
                .catch(() => setHrConfig(null))
        } else {
            setForm(EMPTY_FORM)
            setHrConfig(null)
            setUsernameAutoSet(true)
            setCopied(false)
            setShowPassword(false)
            setPositions([])
            setCurrentOrgUnit(null)
            setFieldErrors({})
            setFormError(null)
        }
    }, [open])

    const emailDomain = hrConfig?.emailDomain ?? null

    // ── Field setters ──────────────────────────────────────────────────────────

    function set<K extends keyof Form>(key: K, value: Form[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    }

    // Auto-derive username when first/last name changes (unless manually overridden)
    function handleFirstNameChange(v: string) {
        setForm((prev) => ({
            ...prev,
            firstName: v,
            username: usernameAutoSet ? deriveUsername(v, prev.lastName) : prev.username,
        }))
        setFieldErrors((prev) => ({ ...prev, firstName: undefined, username: undefined }))
    }

    function handleLastNameChange(v: string) {
        setForm((prev) => ({
            ...prev,
            lastName: v,
            username: usernameAutoSet ? deriveUsername(prev.firstName, v) : prev.username,
        }))
        setFieldErrors((prev) => ({ ...prev, lastName: undefined, username: undefined }))
    }

    function handleUsernameChange(v: string) {
        setUsernameAutoSet(false)
        set('username', v)
    }

    function handleRegenerate() {
        const pw = generatePassword()
        set('password', pw)
        setCopied(false)
    }

    async function handleCopy() {
        await navigator.clipboard.writeText(form.password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleOrgUnitChange(id: string | null) {
        if (!id) return
        set('orgUnitId', id)
        set('positionId', '')

        try {
            const [orgUnit, positionsData] = await Promise.all([
                apiFetch<OrgUnitOption>(`/org-units/${id}`),
                apiFetch<PositionOption[]>(`/org-units/${id}/positions`),
            ])
            setCurrentOrgUnit(orgUnit)
            setPositions(positionsData)
        } catch {
            setCurrentOrgUnit(null)
            setPositions([])
        }
    }

    // ── Submit ─────────────────────────────────────────────────────────────────

    async function handleSubmit() {
        const errors = validate(form, emailDomain)
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        setSaving(true)
        setFormError(null)

        try {
            const loginEmail = emailDomain
                ? `${form.username.trim()}@${emailDomain}`
                : form.email.trim().toLowerCase()

            const employee = await apiFetch<{ id: string }>('/employees', {
                method: 'POST',
                body: JSON.stringify({
                    firstName: form.firstName.trim(),
                    middleName: form.middleName.trim() || undefined,
                    lastName: form.lastName.trim(),
                    email: loginEmail,
                    alternateEmail: form.alternateEmail.trim().toLowerCase() || undefined,
                    password: form.password,
                    orgUnitId: form.orgUnitId,
                    positionId: form.positionId,
                    supervisorId: form.supervisorId ?? undefined,
                    hireDate: form.hireDate,
                }),
            })

            onOpenChangeAction(false)
            router.push(`/people/employees/${employee.id}`)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create employee.')
        } finally {
            setSaving(false)
        }
    }

    const today = new Date()

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Employee</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-3">
                        <RequiredInput
                            label="First Name"
                            value={form.firstName}
                            required
                            touched={!!fieldErrors.firstName}
                            errorMessage={fieldErrors.firstName}
                            onChangeAction={handleFirstNameChange}
                        />
                        <RequiredInput
                            label="Middle Name"
                            value={form.middleName}
                            onChangeAction={(v) => set('middleName', v)}
                        />
                        <RequiredInput
                            label="Last Name"
                            value={form.lastName}
                            required
                            touched={!!fieldErrors.lastName}
                            errorMessage={fieldErrors.lastName}
                            onChangeAction={handleLastNameChange}
                        />
                    </div>

                    <Separator />

                    {/* ── Login Email ───────────────────────────────────────── */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>
                                Login Email <span className="text-red-500">*</span>
                            </Label>

                            {emailDomain ? (
                                /* Domain-mode: username@domain.com */
                                <>
                                    <div className="flex items-center">
                                        <Input
                                            value={form.username}
                                            onChange={(e) => handleUsernameChange(e.target.value)}
                                            placeholder="username"
                                            className="rounded-r-none flex-1 focus-visible:z-10"
                                        />
                                        <span className="inline-flex items-center px-3 h-9 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm whitespace-nowrap">
                                            @{emailDomain}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Auto-generated from name — you can override it.
                                    </p>
                                    {fieldErrors.username && (
                                        <p className="text-xs text-red-500">{fieldErrors.username}</p>
                                    )}
                                </>
                            ) : (
                                /* No domain: full email input */
                                <>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => set('email', e.target.value)}
                                        placeholder="employee@example.com"
                                    />
                                    {fieldErrors.email && (
                                        <p className="text-xs text-red-500">{fieldErrors.email}</p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Notification email */}
                        <div className="space-y-1">
                            <RequiredInput
                                label="Notification Email"
                                value={form.alternateEmail}
                                touched={!!fieldErrors.alternateEmail}
                                errorMessage={fieldErrors.alternateEmail}
                                onChangeAction={(v) => set('alternateEmail', v)}
                                placeholder="Personal or alternate email (optional)"
                            />
                            <p className="text-xs text-muted-foreground">
                                Login credentials will be sent to this address.
                            </p>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label>Password</Label>

                            {/* Mode toggle */}
                            <div className="flex rounded-md border overflow-hidden text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        set('passwordMode', 'auto')
                                        set('password', generatePassword())
                                        setCopied(false)
                                    }}
                                    className={`flex-1 px-3 py-1.5 transition-colors ${form.passwordMode === 'auto'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    Auto-generate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        set('passwordMode', 'manual')
                                        set('password', '')
                                    }}
                                    className={`flex-1 px-3 py-1.5 border-l transition-colors ${form.passwordMode === 'manual'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    Set manually
                                </button>
                            </div>

                            {/* Auto mode: show generated password with copy + regen */}
                            {form.passwordMode === 'auto' ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono tracking-wide select-all">
                                            {form.password}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="px-2.5 py-1.5 text-xs rounded border hover:bg-muted transition-colors whitespace-nowrap"
                                        >
                                            {copied ? '✓ Copied' : 'Copy'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRegenerate}
                                            className="px-2.5 py-1.5 text-xs rounded border hover:bg-muted transition-colors"
                                            title="Generate new password"
                                        >
                                            ↺
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Copy this before saving — it won&apos;t be shown again.
                                    </p>
                                </div>
                            ) : (() => {
                                // Derive login email for the contains-email rule
                                const loginEmailForRules = emailDomain
                                    ? `${form.username.trim()}@${emailDomain}`
                                    : form.email.trim()
                                // Turn rules colored once the user has typed OR after a failed submit
                                const colored = form.password.length > 0 || !!fieldErrors.password
                                const rules = evaluatePasswordRules(form.password, loginEmailForRules)
                                return (
                                    /* Manual mode: editable input with show/hide + live rules */
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={(e) => set('password', e.target.value)}
                                                placeholder="Min. 8 characters"
                                                className="pr-14"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                tabIndex={-1}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? 'Hide' : 'Show'}
                                            </button>
                                        </div>

                                        {/* Live password rules */}
                                        <div className="space-y-0.5 pt-0.5">
                                            {rules.map((rule) => (
                                                <div
                                                    key={rule.label}
                                                    className={`flex items-center gap-1.5 text-xs transition-colors ${!colored
                                                        ? 'text-muted-foreground'
                                                        : rule.passed
                                                            ? 'text-green-600'
                                                            : 'text-red-500'
                                                        }`}
                                                >
                                                    <span className="w-3 text-center leading-none">
                                                        {!colored ? '·' : rule.passed ? '✓' : '✗'}
                                                    </span>
                                                    <span>{rule.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Only show text error in auto mode (manual mode uses rule indicators) */}
                            {form.passwordMode === 'auto' && fieldErrors.password && (
                                <p className="text-xs text-red-500">{fieldErrors.password}</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* ── Employment ────────────────────────────────────────── */}
                    <div className="space-y-3">
                        <DatePickerField
                            label="Hire Date"
                            value={form.hireDate}
                            required
                            error={fieldErrors.hireDate}
                            toDate={today}
                            onChangeAction={(v) => set('hireDate', v)}
                        />

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <AsyncSearchSelect
                                    label="Org Unit"
                                    value={form.orgUnitId}
                                    onChange={handleOrgUnitChange}
                                    fetchOptions={async (search) => {
                                        const list = await apiFetch<OrgUnitOption[]>(
                                            `/org-units/search?leavesOnly=true&showDeleted=false&limit=20&query=${encodeURIComponent(search)}`,
                                        )
                                        if (currentOrgUnit && !list.some((o) => o.id === currentOrgUnit.id)) {
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
                                {fieldErrors.orgUnitId && (
                                    <p className="text-xs text-red-500 mt-1">{fieldErrors.orgUnitId}</p>
                                )}
                            </div>

                            <div className="col-span-1">
                                <RequiredSelect
                                    label="Position"
                                    value={form.positionId}
                                    required
                                    touched={!!fieldErrors.positionId}
                                    errorMessage={fieldErrors.positionId}
                                    onChangeAction={(v) => set('positionId', v)}
                                >
                                    {positions.length === 0
                                        ? <SelectItem value="_none" disabled>Select an org unit first</SelectItem>
                                        : positions.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                        ))
                                    }
                                </RequiredSelect>
                            </div>
                        </div>

                        <AsyncSearchSelect
                            label="Supervisor (optional)"
                            value={form.supervisorId}
                            onChange={(v) => set('supervisorId', v)}
                            fetchOptions={async (search) => {
                                const res = await apiFetch<{ data: SupervisorOption[] }>(
                                    `/employees?status=ACTIVE&search=${encodeURIComponent(search)}&pageSize=20`,
                                )
                                return res.data
                            }}
                            getOptionValue={(o) => o.id}
                            getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                            placeholder="Search supervisor..."
                        />
                    </div>

                    {formError && (
                        <p className="text-sm text-red-600 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                            {formError}
                        </p>
                    )}
                </div>

                <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => onOpenChangeAction(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Creating...' : 'Create Employee'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

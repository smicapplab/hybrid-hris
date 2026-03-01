'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { COMMON_PASSWORDS } from '@/lib/employee.enum'

type RuleResult = { label: string; passed: boolean }

function evaluatePasswordRules(password: string, loginEmail: string): RuleResult[] {
    const pwLower = password.toLowerCase()
    const emailLocal = loginEmail.split('@')[0].toLowerCase()
    return [
        { label: 'At least 8 characters', passed: password.length >= 8 },
        { label: 'Not a commonly used password', passed: !COMMON_PASSWORDS.has(pwLower) },
        {
            label: 'Does not contain your email address',
            passed: emailLocal.length < 3 || !pwLower.includes(emailLocal),
        },
    ]
}

function generatePassword(): string {
    const bytes = new Uint8Array(12)
    crypto.getRandomValues(bytes)
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {children}
        </h3>
    )
}

type PasswordMode = 'manual' | 'auto'

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function SecurityPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const loginEmail = user?.email ?? ''

    /* ── Password state ── */
    const [pwMode, setPwMode] = useState<PasswordMode>('manual')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState(() => generatePassword())
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [copied, setCopied] = useState(false)
    const [pwSaving, setPwSaving] = useState(false)

    /* ── PIN state ── */
    const [pin, setPin] = useState<string[]>(Array(6).fill(''))
    const [confirmPin, setConfirmPin] = useState<string[]>(Array(6).fill(''))
    const pinRefs = useRef<(HTMLInputElement | null)[]>([])
    const confirmRefs = useRef<(HTMLInputElement | null)[]>([])
    const [pinSaving, setPinSaving] = useState(false)

    /* ── Password derived ── */
    const rules = evaluatePasswordRules(newPassword, loginEmail)
    const allRulesPassed = rules.every((r) => r.passed)
    const rulesColored = newPassword.length > 0
    const canSubmitPassword = currentPassword.length > 0 && allRulesPassed

    /* ── Password handlers ── */

    function switchMode(mode: PasswordMode) {
        setPwMode(mode)
        setCopied(false)
        if (mode === 'auto') {
            setNewPassword(generatePassword())
        } else {
            setNewPassword('')
        }
    }

    function handleRegenerate() {
        setNewPassword(generatePassword())
        setCopied(false)
    }

    async function handleCopy() {
        await navigator.clipboard.writeText(newPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleChangePassword() {
        if (!canSubmitPassword) return
        setPwSaving(true)
        try {
            await apiFetch('/profile/me/password', {
                method: 'PATCH',
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            toast({ title: 'Password updated', variant: 'success' })
            setCurrentPassword('')
            if (pwMode === 'manual') setNewPassword('')
            else setNewPassword(generatePassword())
            setCopied(false)
        } catch (err) {
            toast({
                title: 'Password change failed',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setPwSaving(false)
        }
    }

    /* ── PIN handlers ── */

    function handlePinChange(
        arr: string[],
        refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
        setFn: (v: string[]) => void,
        index: number,
        value: string,
    ) {
        const digit = value.replace(/\D/g, '').slice(-1)
        const next = [...arr]
        next[index] = digit
        setFn(next)
        if (digit && index < 5) {
            refs.current[index + 1]?.focus()
        }
    }

    function handlePinKeyDown(
        arr: string[],
        refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
        setFn: (v: string[]) => void,
        index: number,
        e: KeyboardEvent<HTMLInputElement>,
    ) {
        if (e.key === 'Backspace' && !arr[index] && index > 0) {
            const next = [...arr]
            next[index - 1] = ''
            setFn(next)
            refs.current[index - 1]?.focus()
        }
    }

    async function handleChangePin() {
        const pinStr = pin.join('')
        const confirmStr = confirmPin.join('')

        if (pinStr.length !== 6 || confirmStr.length !== 6) {
            toast({ title: 'Please fill all 6 digits in both fields', variant: 'destructive' })
            return
        }
        if (pinStr !== confirmStr) {
            toast({ title: 'PINs do not match', variant: 'destructive' })
            return
        }

        setPinSaving(true)
        try {
            await apiFetch('/auth/pin', {
                method: 'PATCH',
                body: JSON.stringify({ pin: pinStr }),
            })
            toast({ title: 'Attendance PIN updated', variant: 'success' })
            setPin(Array(6).fill(''))
            setConfirmPin(Array(6).fill(''))
            pinRefs.current[0]?.focus()
        } catch (err) {
            toast({
                title: 'PIN update failed',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            })
        } finally {
            setPinSaving(false)
        }
    }

    const pinReady = pin.every((d) => d !== '') && confirmPin.every((d) => d !== '')

    if (!user) return null

    /* ── Render ── */

    return (
        <Card>
            <CardContent className="p-6 space-y-8">

                {/* ── Change Password ── */}
                <div className="space-y-4">
                    <SectionTitle>Change Password</SectionTitle>

                    {/* Mode toggle */}
                    <div className="flex rounded-md border overflow-hidden text-sm w-fit">
                        {(['manual', 'auto'] as PasswordMode[]).map((mode, i) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => switchMode(mode)}
                                className={[
                                    'px-4 py-1.5 transition-colors',
                                    i > 0 ? 'border-l' : '',
                                    pwMode === mode
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:bg-muted',
                                ].join(' ')}
                            >
                                {mode === 'manual' ? 'Set manually' : 'Auto-generate'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 max-w-sm">
                        {/* Current password — always required */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium" htmlFor="currentPw">
                                Current Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="currentPw"
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    className="pr-14"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowCurrent((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    {showCurrent ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {/* New password — varies by mode */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">New Password</label>

                            {pwMode === 'auto' ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono tracking-wide select-all">
                                            {newPassword}
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
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className="pr-14"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowNew((v) => !v)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            {showNew ? 'Hide' : 'Show'}
                                        </button>
                                    </div>

                                    {/* Live rules */}
                                    <div className="space-y-0.5 pt-0.5">
                                        {rules.map((rule) => (
                                            <div
                                                key={rule.label}
                                                className={[
                                                    'flex items-center gap-1.5 text-xs transition-colors',
                                                    !rulesColored
                                                        ? 'text-muted-foreground'
                                                        : rule.passed
                                                            ? 'text-green-600'
                                                            : 'text-red-500',
                                                ].join(' ')}
                                            >
                                                <span className="w-3 text-center leading-none">
                                                    {!rulesColored ? '·' : rule.passed ? '✓' : '✗'}
                                                </span>
                                                <span>{rule.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleChangePassword}
                            disabled={pwSaving || !canSubmitPassword}
                            className="w-full sm:w-auto"
                        >
                            {pwSaving ? 'Saving…' : 'Update Password'}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* ── Change Attendance PIN ── */}
                <div className="space-y-4">
                    <div className="space-y-0.5">
                        <SectionTitle>Attendance PIN</SectionTitle>
                        <p className="text-xs text-muted-foreground">
                            Your 6-digit PIN is used at the kiosk to punch in and out.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* New PIN */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">New PIN</label>
                            <div className="flex gap-2">
                                {pin.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { pinRefs.current[i] = el }}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handlePinChange(pin, pinRefs, setPin, i, e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handlePinKeyDown(pin, pinRefs, setPin, i, e)
                                        }
                                        className="w-10 h-10 text-center text-sm rounded-md border border-input bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Confirm PIN */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Confirm PIN</label>
                            <div className="flex gap-2">
                                {confirmPin.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { confirmRefs.current[i] = el }}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handlePinChange(confirmPin, confirmRefs, setConfirmPin, i, e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handlePinKeyDown(confirmPin, confirmRefs, setConfirmPin, i, e)
                                        }
                                        className="w-10 h-10 text-center text-sm rounded-md border border-input bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                                    />
                                ))}
                            </div>
                            {/* Mismatch hint (only when both are full) */}
                            {pinReady && pin.join('') !== confirmPin.join('') && (
                                <p className="text-xs text-red-500 pt-0.5">PINs do not match</p>
                            )}
                        </div>

                        <Button
                            onClick={handleChangePin}
                            disabled={pinSaving || !pinReady || pin.join('') !== confirmPin.join('')}
                            className="w-full sm:w-auto"
                        >
                            {pinSaving ? 'Saving…' : 'Update PIN'}
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}

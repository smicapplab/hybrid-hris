'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const STORAGE_KEY = 'attendance_prefix'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export function PunchForm() {
    const { toast } = useToast()

    const [prefix, setPrefix] = useState<string | null>(null)
    const [employeeSuffix, setEmployeeSuffix] = useState('')
    const [pin, setPin] = useState<string[]>(Array(6).fill(''))
    const [loading, setLoading] = useState(false)

    const pinRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

    // Load prefix from localStorage on mount, or fetch from API and cache it
    useEffect(() => {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached !== null) {
            setPrefix(cached)
            return
        }
        fetch(`${API_URL}/attendance/employee-prefix`)
            .then((r) => r.json())
            .then((data: { prefix: string }) => {
                const p = data.prefix ?? ''
                setPrefix(p)
                localStorage.setItem(STORAGE_KEY, p)
            })
            .catch(() => {
                setPrefix('') // silent fallback — input still works without prefix
            })
    }, [])

    function handlePinChange(index: number, value: string) {
        // Only allow a single digit
        if (!/^\d?$/.test(value)) return
        const next = [...pin]
        next[index] = value.slice(-1)
        setPin(next)
        // Advance to next slot when a digit is entered
        if (value && index < 5) {
            pinRefs.current[index + 1]?.focus()
        }
    }

    function handlePinKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        // On backspace in an empty slot, move focus back to the previous slot
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus()
        }
    }

    function getEmployeeNumber(): string {
        const suffix = employeeSuffix.trim()
        if (!prefix) return suffix
        return `${prefix}${suffix}`
    }

    function resetForm() {
        setEmployeeSuffix('')
        setPin(Array(6).fill(''))
        // Return focus to the employee number field after reset
        setTimeout(() => {
            document.getElementById('employeeSuffix')?.focus()
        }, 100)
    }

    async function handlePunch(type: 'in' | 'out') {
        setLoading(true)
        const pinStr = pin.join('')

        try {
            const endpoint =
                type === 'in' ? '/attendance/punch-in' : '/attendance/punch-out'

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeNumber: getEmployeeNumber(),
                    pin: pinStr,
                    source: 'KIOSK',
                }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(
                    Array.isArray(body.message)
                        ? body.message[0]
                        : (body.message ?? 'Request failed'),
                )
            }

            resetForm()

            toast({
                title: type === 'in' ? '✓ Time In recorded' : '✓ Time Out recorded',
                description: `Logged at ${new Date().toLocaleTimeString()}`,
                variant: 'success',
            })
        } catch (err) {
            toast({
                title: type === 'in' ? 'Time In failed' : 'Time Out failed',
                description:
                    err instanceof Error
                        ? err.message
                        : 'Unable to process request. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const isFormValid =
        employeeSuffix.trim().length > 0 &&
        pin.every((d) => d !== '')

    return (
        <Card>
            <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Employee Time In / Out</h1>
                    <p className="text-muted-foreground">
                        Enter your Employee Number and PIN to record your attendance.
                    </p>
                </div>

                <Field>
                    <FieldLabel htmlFor="employeeSuffix">Employee Number</FieldLabel>
                    <div className="flex items-center">
                        {/* Show prefix badge only when prefix is loaded and non-empty */}
                        {prefix ? (
                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 h-9 text-sm text-muted-foreground select-none whitespace-nowrap">
                                {prefix}
                            </span>
                        ) : null}
                        <Input
                            id="employeeSuffix"
                            value={employeeSuffix}
                            required
                            inputMode="numeric"
                            placeholder="000001"
                            className={prefix ? 'rounded-l-none' : ''}
                            onChange={(e) => setEmployeeSuffix(e.target.value)}
                        />
                    </div>
                </Field>

                <Field>
                    <FieldLabel>PIN</FieldLabel>
                    <div className="flex gap-2 justify-left">
                        {pin.map((digit, i) => (
                            <Input
                                key={i}
                                ref={(el) => {
                                    pinRefs.current[i] = el
                                }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                className="w-14 h-10 text-center p-0 text-lg"
                                onChange={(e) => handlePinChange(i, e.target.value)}
                                onKeyDown={(e) => handlePinKeyDown(i, e)}
                            />
                        ))}
                    </div>
                </Field>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={loading || !isFormValid}
                        onClick={() => handlePunch('in')}
                    >
                        {loading ? 'Processing...' : 'Time In'}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={loading || !isFormValid}
                        onClick={() => handlePunch('out')}
                    >
                        {loading ? 'Processing...' : 'Time Out'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

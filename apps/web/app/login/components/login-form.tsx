'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginForm() {
    const router = useRouter()
    const { login, isLoading } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        try {
            await login(email, password)
            router.push('/dashboard')
        } catch {
            setError('Invalid email or password. Please try again.')
        }
    }

    return (
        <Card>
            <CardContent>
                <div className="flex flex-col items-center gap-2 text-center w-full my-5">
                    <h1 className="text-2xl font-bold">Sign in to HRIS</h1>
                    <p className="text-muted-foreground">
                        Enter your email and password to access the HRIS platform.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-500 text-sm p-2 my-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="email">Work Email Address</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Field>
                    </FieldGroup>

                    <Field>
                        <FieldLabel htmlFor="password">Account Password</FieldLabel>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-14"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </Field>

                    <Field>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </Field>

                    <FieldDescription className="px-6 text-center">
                        Access is restricted to authorized employees only.
                    </FieldDescription>
                </form>
            </CardContent>
        </Card>
    )
}
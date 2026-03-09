'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { AuthConfig } from '../page'
import { Mail, Globe, Lock, Info, Loader2 } from 'lucide-react'

export function LoginForm({ config }: { config: AuthConfig | null }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login, isLoading } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const oauthError = searchParams.get('error')
    const displayError = error || (oauthError === 'oauth_failed' ? 'Social login failed. Please try again or use your password.' : null);

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

    const handleGoogleLogin = () => {
        // To be implemented: redirect to API google auth
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
    }

    const handleMicrosoftLogin = () => {
        // To be implemented: redirect to API microsoft auth
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/microsoft`
    }

    const showOAuth = config?.googleLoginEnabled || config?.microsoftLoginEnabled;
    const showPasswordLogin = config?.passwordLoginEnabled !== false;

    return (
        <Card className="shadow-lg border-blue-50">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 text-center w-full mb-8">
                    <h1 className="text-2xl font-bold text-blue-900">Sign in to HRIS</h1>
                    <p className="text-muted-foreground text-sm">
                        Access your organizational dashboard and self-service tools.
                    </p>
                </div>

                {displayError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md mb-6">
                        {displayError}
                    </div>
                )}

                {config?.isDemo && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[11px] p-2.5 rounded-md mb-6 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <p>
                            <strong>Demo Mode:</strong> Google and Microsoft buttons are visible for demonstration. 
                            OAuth is currently inactive as API keys are not configured.
                        </p>
                    </div>
                )}

                <div className="space-y-6">
                    {/* OAuth Buttons */}
                    {showOAuth && (
                        <div className="space-y-3">
                            {config?.googleLoginEnabled && (
                                <Button 
                                    variant="outline" 
                                    className="w-full gap-2 border-gray-200 hover:bg-gray-50"
                                    onClick={handleGoogleLogin}
                                >
                                    <Globe className="w-4 h-4 text-red-500" />
                                    Continue with Google
                                </Button>
                            )}
                            {config?.microsoftLoginEnabled && (
                                <Button 
                                    variant="outline" 
                                    className="w-full gap-2 border-gray-200 hover:bg-gray-50"
                                    onClick={handleMicrosoftLogin}
                                >
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    Continue with Microsoft 365
                                </Button>
                            )}
                        </div>
                    )}

                    {showOAuth && showPasswordLogin && (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">Or use your password</span>
                            </div>
                        </div>
                    )}

                    {/* Email/Password Form */}
                    {showPasswordLogin && (
                        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="email">Work Email</FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        required
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11"
                                    />
                                </Field>
                            </FieldGroup>

                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-14 h-11"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-medium"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </Field>

                            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 mt-2">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {!showPasswordLogin && !showOAuth && (
                        <div className="text-center py-4 text-red-500 text-sm font-medium">
                            No login methods are currently available. Please contact your administrator.
                        </div>
                    )}

                    <div className="pt-2 text-center">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
                            Secure Access Only
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
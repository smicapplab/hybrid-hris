'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { NumericInput } from '@/components/ui/numeric-input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Mail, Globe, Hash } from 'lucide-react';
import { TIMEZONE_OPTIONS } from '@/lib/employee.enum';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type HrSettings = {
    employeeNoPrefix: string;
    employeeNoNext: number;
    employeeNoPadding: number;
    emailDomain: string | null;
    timezone: string;
    passwordLoginEnabled: boolean;
    googleLoginEnabled: boolean;
    microsoftLoginEnabled: boolean;
    allowedWorkspaceDomains: string[] | null;
};

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<HrSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await apiFetch<HrSettings>('/hr-settings');
                setSettings(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load settings';
                toast({ title: 'Error', description: message, variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            // Sanitize payload to remove read-only/internal fields forbidden by API
            // We use destructuring to pick only the fields defined in the Update DTO
            const { 
                employeeNoPrefix, 
                employeeNoNext, 
                employeeNoPadding, 
                emailDomain, 
                timezone, 
                passwordLoginEnabled, 
                googleLoginEnabled, 
                microsoftLoginEnabled, 
                allowedWorkspaceDomains 
            } = settings;

            const payload = {
                employeeNoPrefix,
                employeeNoNext,
                employeeNoPadding,
                emailDomain,
                timezone,
                passwordLoginEnabled,
                googleLoginEnabled,
                microsoftLoginEnabled,
                allowedWorkspaceDomains
            };
            
            await apiFetch('/hr-settings', {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            toast({ title: 'Success', description: 'Settings updated successfully.', variant: 'success' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update settings';
            toast({ title: 'Update Failed', description: message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="p-6 max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-900">Organization Settings</h1>
                    <p className="text-muted-foreground text-sm">Manage global system configurations and authentication methods.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save All Changes
                </Button>
            </div>

            <div className="grid gap-8">
                {/* Identification & Formatting */}
                <Card className="shadow-sm border-blue-50">
                    <CardHeader className="bg-blue-50/30 border-b">
                        <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-blue-600" />
                            <CardTitle className="text-lg">Identification & Formatting</CardTitle>
                        </div>
                        <CardDescription>Configure how employee IDs and organizational details are issue.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="prefix">Employee No. Prefix</Label>
                            <Input
                                id="prefix"
                                value={settings.employeeNoPrefix}
                                onChange={(e) => setSettings({ ...settings, employeeNoPrefix: e.target.value })}
                                placeholder="e.g., EMP-"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="padding">Padding Length</Label>
                            <NumericInput
                                className='w-16'
                                id="padding"
                                mode="int"
                                value={settings.employeeNoPadding}
                                onChangeAction={(val) => setSettings({ ...settings, employeeNoPadding: val })}
                                min={1}
                                max={10}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Company Email Domain</Label>
                            <Input
                                id="domain"
                                value={settings.emailDomain || ''}
                                onChange={(e) => setSettings({ ...settings, emailDomain: e.target.value })}
                                placeholder="e.g., company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Default Timezone</Label>
                            <Select 
                                value={settings.timezone} 
                                onValueChange={(v) => setSettings({ ...settings, timezone: v })}
                            >
                                <SelectTrigger id="timezone">
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {TIMEZONE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">
                                Used as fallback when an employee doesn&apos;t have a specific timezone set.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Authentication Methods */}
                <Card className="shadow-sm border-blue-50 overflow-hidden">
                    <CardHeader className="bg-blue-50/30 border-b">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <CardTitle className="text-lg">Authentication Methods</CardTitle>
                        </div>
                        <CardDescription>Control how users can access the system. Standard email/password remains a fail-safe.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-blue-50">
                            <div className="p-6 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email & Password Login</Label>
                                    <p className="text-sm text-muted-foreground italic">
                                        Allow login using internal credentials. Always enabled if no Workspaces are configured.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.passwordLoginEnabled}
                                    onCheckedChange={(v) => setSettings({ ...settings, passwordLoginEnabled: v })}
                                />
                            </div>

                            <div className="p-6 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        <Label className="text-base">Google Workspace OAuth</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">
                                        Enable &apos;Sign in with Google&apos; for corporate accounts. Requires client ID/secret in .env.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.googleLoginEnabled}
                                    onCheckedChange={(v) => setSettings({ ...settings, googleLoginEnabled: v })}
                                />
                            </div>

                            <div className="p-6 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <Label className="text-base">Microsoft 365 OAuth</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">
                                        Enable Azure AD/Microsoft login. Requires client ID/secret in .env.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.microsoftLoginEnabled}
                                    onCheckedChange={(v) => setSettings({ ...settings, microsoftLoginEnabled: v })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Workspace Restrictions */}
                <Card className="shadow-sm border-blue-50">
                    <CardHeader className="bg-blue-50/30 border-b">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <CardTitle className="text-lg">Workspace Restrictions</CardTitle>
                        </div>
                        <CardDescription>Restrict OAuth logins to specific corporate domains.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="allowedDomains">Allowed Domains (Comma separated)</Label>
                            <Input
                                id="allowedDomains"
                                value={settings.allowedWorkspaceDomains?.join(', ') || ''}
                                onChange={(e) => {
                                    const domains = e.target.value.split(',').map(d => d.trim()).filter(Boolean);
                                    setSettings({ ...settings, allowedWorkspaceDomains: domains });
                                }}
                                placeholder="e.g., hybrid-hris.local, company.com"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Only users with emails from these domains will be able to use OAuth login.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

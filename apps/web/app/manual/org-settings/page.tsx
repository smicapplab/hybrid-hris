import React from "react";
import { Settings, ShieldCheck, Mail, Globe, Hash, CheckCircle2, Info, Lock, Globe2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ManualOrgSettingsPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">System Governance</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-8 h-8 text-orange-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Organization Settings</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Manage global system configurations, authentication methods, and workspace-wide rules for your entire organization.
        </p>
      </header>

      <div className="space-y-12">
        {/* Section 1: Identification */}
        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Identification & Formatting</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Define how the system generates and formats identifiers for your personnel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card className="p-4 border shadow-sm">
                <Hash className="w-4 h-4 text-orange-600 mb-2" />
                <p className="text-sm font-bold">Employee ID Generation</p>
                <p className="text-xs text-gray-500">Configure prefixes (e.g., "EMP-") and padding length for sequential IDs.</p>
              </Card>
              <Card className="p-4 border shadow-sm">
                <Globe2 className="w-4 h-4 text-orange-600 mb-2" />
                <p className="text-sm font-bold">Default Timezone</p>
                <p className="text-xs text-gray-500">The global fallback timezone for all system-wide calculations.</p>
              </Card>
            </div>
            <Separator />
          </div>
        </div>

        {/* Section 2: Authentication */}
        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise Authentication</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Hybrid HRIS supports modern enterprise authentication to ensure secure and seamless access.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm">
                <div className="bg-blue-100 p-2 rounded-lg h-fit">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Standard Login</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Default email and password authentication. Can be disabled once OAuth is configured.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm">
                <div className="bg-emerald-100 p-2 rounded-lg h-fit">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">OAuth Providers (SSO)</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Native support for <strong>Google Workspace</strong> and <strong>Microsoft 365</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm">
                <div className="bg-orange-100 p-2 rounded-lg h-fit">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Workspace Restrictions</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Restrict login access to specific corporate domains to prevent unauthorized account creation.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center mb-8">
              <img src="/screenshots/org-settings-auth.png" alt="Authentication & Security Settings" className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

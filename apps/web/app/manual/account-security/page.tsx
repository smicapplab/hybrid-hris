import React from "react";
import { Lock, ShieldCheck, CheckCircle2, Info, Key, ShieldAlert, History, Smartphone, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function AccountSecurityPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Employee Center</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Privacy & Protection</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-8 h-8 text-red-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Account Security</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Protecet your sensitive HR data by managing your credentials, enabling multi-factor authentication, and monitoring account activity.
        </p>
      </header>

      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="credentials">Credentials & 2FA</TabsTrigger>
          <TabsTrigger value="activity">Login Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password & 2FA Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Update your password regularly and enable <strong>Multi-Factor Authentication (2FA)</strong> to add an extra layer of protection to your account.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <Key className="w-4 h-4 text-red-600 mb-2" />
                  <p className="text-sm font-bold">Update Password</p>
                  <p className="text-[10px] text-gray-500">Change your login credentials securely.</p>
                </Card>
                <Card className="p-4 border border-blue-100 bg-blue-50/30">
                  <Smartphone className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-sm font-bold">Enable 2FA</p>
                  <p className="text-[10px] text-blue-500 font-medium">Highly Recommended: Use Authenticator apps.</p>
                </Card>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/account-security-settings.png" alt="Account Security Settings" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Audit Login Sessions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Monitor your active sessions and login history. If you see unrecognized activity, use the <strong>Logout from all devices</strong> button immediately.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-12 text-center mb-8">
                <History className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-400 italic">Screenshot: Active Sessions List</p>
              </div>
              <Card className="p-4 border bg-red-50 border-red-100">
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-bold text-red-900">Emergency Global Sign-Out</p>
                    <p className="text-xs text-red-700/80">Instantly terminate all active sessions across web and mobile.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

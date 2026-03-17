import React from "react";
import { Timer, CheckCircle2, Info, Clock, MapPin, ShieldCheck, ClipboardCheck, History, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function AttendancePage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Operations</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Timer className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Attendance & Timesheets</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Track real-time presence, manage overtime approvals, and verify employee work hours through automated timesheet auditing.
        </p>
      </header>

      <Tabs defaultValue="presence" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="clocking">Clocking In/Out</TabsTrigger>
          <TabsTrigger value="presence">Real-time Presence</TabsTrigger>
          <TabsTrigger value="approvals">Overtime & Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="clocking" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard Clock-in (Authenticated)</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The most common way to track time. Once logged in, use the <strong>Attendance Widget</strong> at the top of your dashboard.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="p-4 border bg-indigo-50/50">
                  <div className="flex items-center gap-2 mb-2 font-bold text-indigo-900">
                    <UserCheck className="w-4 h-4" />
                    Simple Toggle
                  </div>
                  <p className="text-sm text-gray-700">Click the large toggle button to start or end your work day. The system captures your timestamp instantly.</p>
                </Card>
                <Card className="p-4 border bg-indigo-50/50">
                  <div className="flex items-center gap-2 mb-2 font-bold text-indigo-900">
                    <Clock className="w-4 h-4" />
                    Daily Summary
                  </div>
                  <p className="text-sm text-gray-700">View your today's total work hours, lunch breaks, and scheduled shift directly in the widget.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Kiosk Mode (Unauthenticated)</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Designed for tablet-based wall mounts at office entrances. Employees can clock-in without logging into their full account.
              </p>
              <div className="bg-slate-900 text-white p-6 rounded-xl mb-8">
                <div className="flex gap-4 items-start">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold mb-2">How to Use Kiosk:</p>
                    <ol className="text-xs text-gray-400 space-y-2 list-decimal pl-4">
                      <li>Navigate to the <strong>Login Page</strong>.</li>
                      <li>Select the <strong>"Time In/Out"</strong> tab above the login form.</li>
                      <li>Enter your <strong>Employee ID</strong> or <strong>Email</strong>.</li>
                      <li>Click the action button. (Note: Security checks like PINs or Photo capture may apply depending on policy).</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col">
                <img src="/screenshots/login-kiosk.png" alt="Login Kiosk" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="presence" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Live Presence Tracking</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The <strong>Presence Dashboard</strong> provides a bird's-eye view of who is currently on-site, working remotely, or away.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col  mb-8">
                <img src="/screenshots/attendance-presence.png" alt="Attendance Presence" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Overtime & Discrepancy Approvals</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Managers must sign off on any work hours that deviate from the assigned shift (e.g., Overtime, Late Ins, Early Outs).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm">Auto-Flagging</span>
                  </div>
                  <p className="text-xs text-gray-500">System automatically detects and flags timesheet discrepancies for review.</p>
                </Card>
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm">One-Click Approval</span>
                  </div>
                  <p className="text-xs text-gray-500">Approve batches of overtime requests directly from the dashboard.</p>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React from "react";
import { LayoutDashboard, Bell, Search, CheckCircle2, Clock, Calendar, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ManualDashboardPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Getting Started</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Interface Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard & Navigation</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Your command center. The dashboard provides a real-time snapshot of your individual and team-wide HR activities.
        </p>
      </header>

      <div className="space-y-12">
        {/* Section 1: Top Bar */}
        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">The Global Top Bar</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Accessible from any page, the top bar provides quick access to notifications, global search, and your profile settings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 border bg-gray-50/50">
                <Search className="w-4 h-4 text-blue-600 mb-2" />
                <p className="text-sm font-bold">Global Search</p>
                <p className="text-xs text-gray-500">Find employees or specific modules instantly.</p>
              </Card>
              <Card className="p-4 border bg-gray-50/50">
                <Bell className="w-4 h-4 text-blue-600 mb-2" />
                <p className="text-sm font-bold">Smart Alerts</p>
                <p className="text-xs text-gray-500">Real-time alerts for approvals and deadlines.</p>
              </Card>
              <Card className="p-4 border bg-gray-50/50">
                <Clock className="w-4 h-4 text-blue-600 mb-2" />
                <p className="text-sm font-bold">Time Tracker</p>
                <p className="text-xs text-gray-500">Daily clock-in/out status at a glance.</p>
              </Card>
            </div>
            <Separator />
          </div>
        </div>

        {/* Section 2: Dashboard Widgets */}
        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Operational Widgets</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              The main dashboard contains dynamic widgets tailored to your role.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm">
                <div className="bg-amber-100 p-2 rounded-lg h-fit">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Pending Approvals</p>
                  <p className="text-xs text-gray-500 mt-1 italic">Exclusive to Managers & Admin</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    A consolidated view of Leave, Overtime, and Expense requests awaiting your verification.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm">
                <div className="bg-emerald-100 p-2 rounded-lg h-fit">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Upcoming Leaves</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Tracks both your personal upcoming time-off and your team's schedule to prevent overlap.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm">
                <div className="bg-indigo-100 p-2 rounded-lg h-fit">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Learning Path</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Quick access to mandatory training sessions and upcoming development workshops.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center mb-8">
              <img src="/screenshots/dashboard-main.png" alt="Dashboard Main" className="w-full" />
            </div>
            <Separator />
          </div>
        </div>

        {/* Section 3: Navigation */}
        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Category-Based Sidebar</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              The Sidebar is grouped into logical modules to streamline your workflow:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                <strong>Administration:</strong> Core systems & Org control.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                <strong>Employee Center:</strong> Your personal HR portal.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                <strong>Financials:</strong> Payroll & Expense tracking.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                <strong>Attendance:</strong> Time tracking & Shifts.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

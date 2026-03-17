import React from "react";
import { Users, UserPlus, CheckCircle2, Info, ShieldCheck, Mail, Lock, UserCog, Filter, Search, Fingerprint, Briefcase, Calendar, Banknote, Coins, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function UserManagementPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Onboard employees, manage identities, and define role-based access controls for your entire organization.
        </p>
      </header>

      <Tabs defaultValue="onboarding" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="profile">Profile Deep-Dive</TabsTrigger>
          <TabsTrigger value="rbac">Access Control</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Adding a New Employee</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Navigate to <strong>Administration &rarr; Users</strong> and click <strong>+ Add Employee</strong>. You will need to provide basic identity info and assign them to an initial <strong>Org Unit</strong> and <strong>Position</strong>.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center mb-8">
                <img src="/screenshots/user-onboarding.png" alt="New Employee Onboarding Form" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Employee Profile (360° View)</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Each employee has a comprehensive profile page divided into specialized modules for granular data management.
              </p>

              <div className="space-y-6">
                <Card className="p-4 border-l-4 border-l-blue-600">
                  <div className="flex gap-4">
                    <Fingerprint className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Work & Identity</p>
                      <p className="text-xs text-gray-500 mt-1">Manage official Job Titles, Employment Status (Regular, Probation, etc.), Government IDs, and Work Email.</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-violet-600">
                  <div className="flex gap-4">
                    <MapPin className="w-6 h-6 text-violet-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Personal Info</p>
                      <p className="text-xs text-gray-500 mt-1">Demographics, residential addresses, emergency contacts, and personal contact details.</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-orange-600">
                  <div className="flex gap-4">
                    <Calendar className="w-6 h-6 text-orange-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Schedule & Attendance</p>
                      <p className="text-xs text-gray-500 mt-1">View the employee's assigned Shift Rota, real-time presence history, and punch-in/out logs.</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-emerald-600">
                  <div className="flex gap-4">
                    <Banknote className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Payroll History</p>
                      <p className="text-xs text-gray-500 mt-1">Archive of all generated payslips, tax certificates, and historical earnings records for this employee.</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-amber-600">
                  <div className="flex gap-4">
                    <Coins className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Compensation</p>
                      <p className="text-xs text-gray-500 mt-1">Detailed breakdown of Salary Components, recurring allowances, and upcoming scheduled adjustments.</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center mt-8">
                <img src="/screenshots/employee-profile-360.png" alt="Employee Profile View" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rbac" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Role-Based Access Control (RBAC)</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The system uses a granular RBAC model. Assign users to specific groups (e.g., HR, Finance, Manager, Employee) to control visibility and editing permissions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <ShieldCheck className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-sm font-bold">Function-Level</p>
                  <p className="text-[10px] text-gray-500">Enable/Disable specific menus or buttons.</p>
                </Card>
                <Card className="p-4 border">
                  <Filter className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-sm font-bold">Data-Level (Scoping)</p>
                  <p className="text-[10px] text-gray-500">Restrict visibility to specific Org Units or Geographies.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-12 mt-0">
          <div className="relative pl-12 text-center text-gray-400 italic py-10">
            <UserCog className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-blue-900 uppercase">Automated Maintenance</p>
            <p className="text-xs mt-2">Use CSV/Excel imports to perform bulk updates to employee data, compensation, and position changes.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

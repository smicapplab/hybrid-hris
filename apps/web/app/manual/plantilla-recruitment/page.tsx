import React from "react";
import { ClipboardList, CheckCircle2, Info, Search, UserPlus, ClipboardCheck, TrendingUp, Users, LayoutDashboard, FileCheck, ArrowRightLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function PlantillaRecruitmentPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-teal-600 border-teal-200 bg-teal-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Growth & Planning</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList className="w-8 h-8 text-teal-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Plantilla & Recruitment</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Manage your organizational headcount (Plantilla) and streamline the recruitment process through integrated manpower requests and inventory tracking.
        </p>
      </header>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="inventory">Plantilla Inventory</TabsTrigger>
          <TabsTrigger value="requests">Manpower Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Plantilla Inventory Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The **Plantilla Inventory** is the master record of all approved positions within the organization. It tracks **Capacity** (authorized slots) versus **Actual** (filled slots).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="p-4 border text-center">
                  <Badge className="bg-blue-600 mb-2 mx-auto">Authorized</Badge>
                  <p className="text-2xl font-bold text-gray-900">150</p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Total Slots</p>
                </Card>
                <Card className="p-4 border text-center">
                  <Badge className="bg-emerald-600 mb-2 mx-auto">Filled</Badge>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Active Employees</p>
                </Card>
                <Card className="p-4 border text-center border-amber-200 bg-amber-50/50">
                  <Badge className="bg-amber-600 mb-2 mx-auto">Vacant</Badge>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Open for Hiring</p>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Functional Highlights:</h4>
                <div className="flex gap-4 items-start">
                  <LayoutDashboard className="w-5 h-5 text-teal-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 italic">Position Roster</p>
                    <p className="text-xs text-gray-600 leading-relaxed">View which specific employees are occupying which plantilla slots. This prevents over-hiring beyond the approved budget.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <TrendingUp className="w-5 h-5 text-teal-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 italic">Utilization Tracking</p>
                    <p className="text-xs text-gray-600 leading-relaxed">Identify units with high vacancy rates or those approaching their hiring ceiling.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col my-8">
                <img src="/screenshots/plantilla-inventory-2.png" alt="Plantilla Inventory" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manpower Requests (MR)</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The **Manpower Request** workflow is the formal process for initiating a new hire. It ensures all recruitment activity is aligned with organizational strategy and budget.
              </p>

              <div className="bg-teal-50 border-teal-100 p-6 rounded-xl mb-8">
                <h4 className="text-sm font-bold text-teal-900 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> How to Initiate a Request
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-[10px] font-extrabold shrink-0">A</div>
                    <p className="text-xs text-teal-800 leading-relaxed">Identify a vacancy in your <strong>Plantilla Inventory</strong> or create a request for a <strong>New Slot</strong> (unbudgeted).</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-[10px] font-extrabold shrink-0">B</div>
                    <p className="text-xs text-teal-800 leading-relaxed">Fill out the MR form with <strong>Justification</strong>, <strong>Job Requirements</strong>, and <strong>Salary Grade</strong>.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-[10px] font-extrabold shrink-0">C</div>
                    <p className="text-xs text-teal-800 leading-relaxed">Submit for approval. The system will automatically route it to Finance (for budget check) and Executives (for strategic sign-off).</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                    Type: Replacement
                  </div>
                  <p className="text-xs text-gray-500">Fill a slot vacated due to resignation or promotion. Usually pre-approved in the budget.</p>
                </Card>
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    <UserPlus className="w-4 h-4 text-teal-600" />
                    Type: Expansion
                  </div>
                  <p className="text-xs text-gray-500">Create a brand new slot. Requires rigorous justification and additional budget allocation.</p>
                </Card>
              </div>

              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col my-8">
                <img src="/screenshots/plantilla-inventory.png" alt="Plantilla Inventory" className="w-full" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

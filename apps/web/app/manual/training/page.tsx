import React from "react";
import { GraduationCap, Book, CheckCircle2, Info, Users, Award, Calendar, Network, Briefcase, ShieldAlert, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function TrainingPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">Talent Management</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="w-8 h-8 text-blue-700" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Training & Development</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Manage training lifecycles with mandatory assignments, pre-requisite trees, and automated compliance tracking.
        </p>
      </header>

      <Tabs defaultValue="logic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="logic">Assignment Logic</TabsTrigger>
          <TabsTrigger value="programs">Training Programs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance & Reporting</TabsTrigger>
        </TabsList>

        <TabsContent value="logic" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Level Mandatory Rules</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Trainings can be assigned with <strong>Mandatory</strong> status. Employees who fail to complete mandatory training by the deadline may be flagged for non-compliance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <Card className="p-4 border flex items-start gap-4">
                    <Users className="w-10 h-10 text-blue-700 shrink-0 p-2 bg-blue-50 rounded" />
                    <div>
                       <p className="text-sm font-bold text-gray-900">Assigned to Individuals</p>
                       <p className="text-xs text-gray-600 leading-relaxed">Personal development plans and targeted upskilling.</p>
                    </div>
                 </Card>
                 <Card className="p-4 border flex items-start gap-4">
                    <Network className="w-10 h-10 text-blue-700 shrink-0 p-2 bg-blue-50 rounded" />
                    <div>
                       <p className="text-sm font-bold text-gray-900">Assigned to Teams/Org Units</p>
                       <p className="text-xs text-gray-600 leading-relaxed">Departmental standard operating procedures (SOPs).</p>
                    </div>
                 </Card>
                 <Card className="p-4 border flex items-start gap-4">
                    <Briefcase className="w-10 h-10 text-blue-700 shrink-0 p-2 bg-blue-50 rounded" />
                    <div>
                       <p className="text-sm font-bold text-gray-900">Assigned by Position</p>
                       <p className="text-xs text-gray-600 leading-relaxed">Compulsory training required to hold a specific job title.</p>
                    </div>
                 </Card>
                 <Card className="p-4 border flex items-start gap-4">
                    <ShieldAlert className="w-10 h-10 text-blue-700 shrink-0 p-2 bg-blue-50 rounded" />
                    <div>
                       <p className="text-sm font-bold text-gray-900">Org-wide Assignments</p>
                       <p className="text-xs text-gray-600 leading-relaxed">Global compliance training (Compliance, Safety, Values).</p>
                    </div>
                 </Card>
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-12 mt-0">
           <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Prerequisite Trees</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Establish learning paths by setting <strong>Prerequisites</strong>. Employees must complete specific "Level 1" courses before the system unlocks "Level 2" enrollments.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-12 text-center mb-8">
                 <p className="text-sm font-medium text-gray-400 italic">Screenshot: Training Prerequisite Setup</p>
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Compliance Dashboards</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Administrators can monitor organizational compliance via the <strong>Training Dashboard</strong>. 
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <Card className="p-4 border bg-red-50/50 border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldAlert className="w-4 h-4 text-red-600" />
                       <span className="font-bold text-sm text-red-900">Non-Compliance Triggers</span>
                    </div>
                    <p className="text-xs text-red-800/80">Employees missing mandatory training are flagged in Red for manager intervention.</p>
                 </Card>
                 <Card className="p-4 border bg-blue-50/50 border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                       <ListChecks className="w-4 h-4 text-blue-700" />
                       <span className="font-bold text-sm text-blue-900">Reporting</span>
                    </div>
                    <p className="text-xs text-blue-800/80">Generate CSV exports of completion status by department or course.</p>
                 </Card>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-12 text-center mb-8">
                 <p className="text-sm font-medium text-gray-400 italic">Screenshot: Training Compliance Heatmap</p>
                 <code className="mt-2 text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded">public/screenshot/training-compliance.png</code>
              </div>
            </div>
          </div>
          <div className="relative pl-12 text-center text-gray-400 italic py-10">
             <CheckCircle2 className="w-12 h-12 text-blue-700 mx-auto mb-4" />
             <p className="text-sm font-semibold text-blue-900 uppercase">Compliance Logic Active</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

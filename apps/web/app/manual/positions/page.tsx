import React from "react";
import { Briefcase, ListChecks, CheckCircle2, Info, Users, ShieldAlert, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function PositionsPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Role Architecture</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Positions & Jobs</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Define job roles, their requirements, and their placement within the organizational hierarchy.
        </p>
      </header>

      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="management">Job Management</TabsTrigger>
          <TabsTrigger value="requirements">Requirements & Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Job Positions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Go to <strong>Administration &rarr; Positions</strong>. Click <strong>+ New Position</strong>. You must link each position to a specific <strong>Department</strong> and <strong>Rank</strong>.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/position-create.png" alt="Positions Create" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Slot Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Define the headcount for each position. Specify if the position is "Active" or "Vacant". The system will prevent over-hiring beyond the defined slots for a specific Org Unit.
              </p>
              <Card className="bg-amber-50 border-amber-100 mb-8">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Headcount Control</p>
                      <p className="text-xs text-amber-800/80 leading-relaxed">
                        Headcount checks are performed during the employee onboarding workflow. You cannot assign an employee to a position that has reached its full capacity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mandatory Skills & Training</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                You can assign <strong>Mandatory Skills</strong> and <strong>Required Training</strong> to a position.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm">Auto-Assigned Skills</span>
                  </div>
                  <p className="text-xs text-gray-500">Employees assigned to this position automatically get these skills in their profile for assessment.</p>
                </Card>
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm">Prerequisite Training</span>
                  </div>
                  <p className="text-xs text-gray-500">Must be completed before an employee can be promoted to this position.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12 text-center text-gray-400 italic">
            <CheckCircle2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-indigo-900 uppercase tracking-widest">Role Requirements Defined</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

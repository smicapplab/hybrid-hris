import React from "react";
import { LayoutDashboard, Users, UserCog, GraduationCap, Award, CheckCircle2, Info, ListChecks, TrendingUp, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function MyTeamPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Employee Center</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Manager Console</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <LayoutDashboard className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Team</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Empower your direct reports by managing their skill development, training enrollments, and tracking overall team performance.
        </p>
      </header>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="development">Team Development</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Managing Direct Reports</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Select a team member from your dashboard to access their full profile and development options.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-team-dashboard.png" alt="My Team Dashboard" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Managerial Actions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Within a member's profile, you can perform critical upskilling actions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex gap-4">
                  <Award className="w-8 h-8 text-indigo-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Assign Skills</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Directly assign target skills or verify proficiency levels for your reports.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <GraduationCap className="w-8 h-8 text-indigo-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Enroll in Training</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Force-enroll team members in mandatory or recommended training programs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col  mb-8">
                <img src="/screenshots/my-team-skill-assignment.png" alt="My Team Skill Assignment" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Team Compliance & Gaps</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Aggregate views of your team's compliance with mandatory training and proficiency against organizational standards.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-org-view.png" alt="My Org View" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

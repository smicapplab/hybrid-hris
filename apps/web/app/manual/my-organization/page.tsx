import React from "react";
import { Building2, Network, CheckCircle2, Info, Users, ShieldCheck, ListChecks, Target, Fingerprint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function MyOrganizationPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Employee Center</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Work Context</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Organization</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Understand your place in the organizational hierarchy, visualize your team, and track your personal compliance and skill readiness.
        </p>
      </header>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="team">My Org & Team</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gap & Compliance</TabsTrigger>
          <TabsTrigger value="approvals">Approvals & Flows</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Org & Peers</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The <strong>My Org</strong> view highlights your reporting line, including your direct manager and peers within your current Org Unit.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-org-view.png" alt="My Org View" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Skill Gap Analysis</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Compare your current skill levels against the <strong>Position Template</strong> requirements.
              </p>
              <Card className="border-blue-100 bg-blue-50/30 mb-8 px-6 py-4">
                <div className="flex gap-4">
                  <Target className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Career Progression</p>
                    <p className="text-xs text-blue-700 leading-relaxed">The system flags skills you need to develop to qualify for your next promotion or rank increase.</p>
                  </div>
                </div>
              </Card>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personal Compliance</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                A personal scorecard showing your compliance with mandatory trainings and policy acknowledgments.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col  mb-8">
                <img src="/screenshots/my-organization-compliance.png" alt="My Organization Compliance" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-12 mt-0">
          <div className="relative pl-12 text-center text-gray-400 italic py-10">
            <Fingerprint className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-blue-900 uppercase">Approval Matrix Active</p>
            <p className="text-xs mt-2">See exactly who needs to sign off on your requests (Leave, Expenses, etc.) based on your Org Unit.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

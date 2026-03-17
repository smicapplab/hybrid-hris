import React from "react";
import { Award, Target, CheckCircle2, Info, UserPlus, Star, BarChart3, Users, Network, Briefcase, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function SkillsPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Talent Management</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-8 h-8 text-purple-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Skills & Talent Matrix</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Comprehensive skill tracking with mandatory assignments at the individual, team, or organizational level.
        </p>
      </header>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="assignments">Skill Assignments</TabsTrigger>
          <TabsTrigger value="matrix">Talent Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Defining Mandatory Assignments</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Skills can be made <strong>Mandatory</strong> for specific groups. The system tracks compliance and highlights gaps in real-time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <Card className="p-4 border flex items-start gap-4">
                    <Users className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                       <p className="text-sm font-bold">Individual level</p>
                       <p className="text-xs text-gray-500">Specific specialized skills assigned to a person.</p>
                    </div>
                 </Card>
                 <Card className="p-4 border flex items-start gap-4">
                    <Network className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                       <p className="text-sm font-bold">Team / Org Unit level</p>
                       <p className="text-xs text-gray-500">Operational skills required for everyone in a department.</p>
                    </div>
                 </Card>
                 <Card className="p-4 border flex items-start gap-4">
                    <Briefcase className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                       <p className="text-sm font-bold">Position level</p>
                       <p className="text-xs text-gray-500">Core job requirements linked to a specific job title.</p>
                    </div>
                 </Card>
                 <Card className="p-4 border flex items-start gap-4">
                    <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                       <p className="text-sm font-bold">Org-wide level</p>
                       <p className="text-xs text-gray-500">Universal skills like "Code of Conduct" or "IT Security".</p>
                    </div>
                 </Card>
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-12 mt-0">
          <div className="relative pl-12 text-center text-gray-400 italic py-10">
             <Star className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
             <p className="text-sm font-semibold text-purple-900 uppercase">Talent Gap Analysis Enabled</p>
             <p className="text-xs mt-2">Filter by Department or Position to see the organization's proficiency heatmap.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

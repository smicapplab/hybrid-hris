import React from "react";
import { Coins, TrendingUp, CheckCircle2, Info, Sliders, AlertCircle, Briefcase, FileText, Layers, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function CompensationPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Financials</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-8 h-8 text-emerald-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Compensation Management</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Manage salary templates, component structures, and adjustment workflows linked to organizational ranks.
        </p>
      </header>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="templates">Salary Templates</TabsTrigger>
          <TabsTrigger value="ranks">Ranks & Grades</TabsTrigger>
          <TabsTrigger value="adjustments">Increases</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Salary Template Configuration</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Salary templates define a collection of recurring components (Basic Pay, Allowances). Instead of manual entry for every employee, assign a pre-defined template based on their job level.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/compensation-templates.png" alt="Compensation Templates" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ranks" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Linking Compensation to Ranks</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Each <strong>Rank</strong> in the system is mapped to a specific <strong>Salary Template</strong>. When an employee is promoted to a new Rank, their compensation structure automatically updates to match the template assigned to that rank.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <Layers className="w-4 h-4 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold">Rank Baseline</p>
                  <p className="text-xs text-gray-500">Minimum and Maximum salary ranges for the rank.</p>
                </Card>
                <Card className="p-4 border">
                  <Target className="w-4 h-4 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold">Auto-Promotion Adjustment</p>
                  <p className="text-xs text-gray-500">System calculates parity adjustments based on rank changes.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Salary Adjustment Cycles</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Initiate a mass salary review or individual adjustments. Specify the adjustment type (e.g., Merit, Promotion, Cost of Living).
              </p>
              <Card className="bg-amber-50 border-amber-100 mb-8">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Audit Log Required</p>
                      <p className="text-xs text-amber-800/80 leading-relaxed">
                        Adjustments require a justification comment and approval from the Financial Unit lead before they become active on the specified effective date.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React from "react";
import { Layers, Signal, CheckCircle2, Info, TrendingUp, BarChart3, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function RanksPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Grading System</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Layers className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Ranks & Grading</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Establish career levels and pay grades. Ranks categorize positions and define the standard salary ranges and benefits.
        </p>
      </header>

      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="management">Rank Management</TabsTrigger>
          <TabsTrigger value="compensation">Rank & Compensation</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Defining Ranks</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Navigate to <strong>Administration &rarr; Ranks</strong>. Create levels like "Junior", "Senior", "Lead", "Manager", etc. Assign a <strong>Level Order</strong> to establish the seniority hierarchy.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/rank-levels.png" alt="Rank Levels" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Organizational Placement</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Ranks can be restricted to specific <strong>Org Units</strong> or <strong>Job Families</strong>. This prevents an Junior rank from being incorrectly assigned to an Executive-level position.
              </p>
              <Card className="bg-blue-50/30 border-blue-100 mb-8">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Career Paths</p>
                      <p className="text-xs text-blue-800/80 leading-relaxed">
                        Level orders define the logical progression. The system uses this to track internal promotions and lateral movements.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Linking Salary Templates</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Every Rank is linked to a <strong>Salary Template</strong>. This template defines the min/max salary range and the baseline components for anyone at this level.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm">Pay Grade Baseline</span>
                  </div>
                  <p className="text-xs text-gray-500">Standardized allowances and deductions per level.</p>
                </Card>
                <Card className="p-4 border bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm">Budget Caps</span>
                  </div>
                  <p className="text-xs text-gray-500">Enforce maximum salary limits for a specific rank.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12 text-center text-gray-400 italic">
            <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-blue-900 uppercase tracking-widest">Grading Matrix Active</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

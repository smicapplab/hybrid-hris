import React from "react";
import { Wallet, CheckCircle2, Info, TrendingUp, PieChart, Landmark, Network } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function TeamBudgetsPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Financials</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Financial Governance</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Team Budgets</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Manage departmental spending limits with the "Budget Matrix" — a multi-dimensional view of organizational fiscal health.
        </p>
      </header>

      <Tabs defaultValue="matrix" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="matrix">Budget Matrix</TabsTrigger>
          <TabsTrigger value="allocation">Fiscal Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">The Multi-Dimensional Matrix</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The budget matrix tracks spending across <strong>Time</strong> (Monthly/Quarterly/Annual) and <strong>Unit Hierarchy</strong>.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/budget-matrix.png" alt="Budget Matrix" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-12 mt-0">
          <div className="relative pl-12 text-center text-gray-400 italic py-10">
            <PieChart className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-indigo-900 uppercase">Real-time Utilization</p>
            <p className="text-xs mt-2">See exactly how much of a budget is "Planned", "Committed", and "Spent" in real-time.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React from "react";
import { Settings, ShieldCheck, CheckCircle2, Info, Clock, AlertTriangle, Scale, GitMerge, Banknote, BadgeAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function PolicyConfigPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">System Governance</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-8 h-8 text-orange-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Policy Configuration</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Define the "Rules of Engagement" for your organization. From accrual logic to temporal constraints, the policy engine ensures compliance.
        </p>
      </header>

      <Tabs defaultValue="accrual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="accrual">Accrual & Leave Rules</TabsTrigger>
          <TabsTrigger value="work">Work & Overtime Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="accrual" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Leave Accrual Matrix</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Configure how many days employees earn per year. Assignments can be based on <strong>Tenure</strong> (e.g., +1 day every 2 years) or <strong>Employment Status</strong>.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/policy-accrual-rules.png" alt="Policy Accrual Rules" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Proration & Carry-over</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Define what happens to unused leave at the end of the fiscal year.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <Scale className="w-4 h-4 text-orange-600 mb-2" />
                  <p className="text-sm font-bold text-gray-900">Carry-over Limits</p>
                  <p className="text-xs text-gray-500">Maximum days that can be rolled to the next period.</p>
                </Card>
                <Card className="p-4 border">
                  <GitMerge className="w-4 h-4 text-orange-600 mb-2" />
                  <p className="text-sm font-bold text-gray-900">Encashment Rules</p>
                  <p className="text-xs text-gray-500">Automatically convert unused leave to payroll line items.</p>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="work" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Work Hours & Compliance</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Define the boundaries for regular work and how the system should handle deviations.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-lg bg-slate-50 border">
                  <Clock className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Overtime Thresholds</p>
                    <p className="text-xs text-gray-600 mt-1">Configure when OT kicks in (e.g., after 8 hours or 40 hours/week). System supports "Daily" and "Weekly" OT logic simultaneously.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-slate-50 border">
                  <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Late & Undertime Penalties</p>
                    <p className="text-xs text-gray-600 mt-1">Specify grace periods and deduction increments (e.g., 15-min rounding) that flow directly into payroll as "Adjustments".</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col">
                <img src="/screenshots/work-hours-compliance.png" alt="Policy Work Hours" className="w-full" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

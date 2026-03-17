import React from "react";
import { GitPullRequest, CheckCircle2, Info, UserPlus, Coins, Briefcase, ShieldCheck, History, AlertCircle, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function PendingChangesPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Verification Workflow</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <GitPullRequest className="w-8 h-8 text-orange-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Pending Changes</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Hybrid HRIS enforces a "Four-Eyes" principle for sensitive data. Approve or reject proposed updates to employee profiles, compensation, and organizational assignments.
        </p>
      </header>

      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="workflow">Approval Workflow</TabsTrigger>
          <TabsTrigger value="audit">Change History</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">How Changes are Queued</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                When a manager or HR user updates a "Restricted Field" (e.g., Base Salary, Job Title, or Legal Name), the system does not apply the change immediately. Instead, it creates a <strong>Pending Request</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border border-orange-100 bg-orange-50/20">
                  <Coins className="w-4 h-4 text-orange-600 mb-2" />
                  <p className="text-sm font-bold">Financial Changes</p>
                  <p className="text-xs text-gray-500 font-medium">Salary adjustments always require secondary approval.</p>
                </Card>
                <Card className="p-4 border">
                  <Briefcase className="w-4 h-4 text-gray-400 mb-2" />
                  <p className="text-sm font-bold">Structural Changes</p>
                  <p className="text-xs text-gray-500">Org unit moves or position title changes.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reviewing Differences</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The Pending Changes dashboard highlights exact differences. Review the <strong>Existing Value</strong> vs. the <strong>Proposed Value</strong> before taking action.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center mb-8">
                <img src="/screenshots/pending-changes-diff.png" alt="Change Comparison View (Diff)" className="w-full" />
              </div>
              <div className="flex gap-4 py-5">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-6 font-bold flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Approve
                </Button>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-9 px-6 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-12 mt-0 text-center py-20 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-bold text-gray-900 tracking-tight">Immutable Change Log</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2 leading-relaxed">
            Every decision made in this module is recorded in the permanent system audit log, including comments provided by the approver.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React from "react";
import { Calendar, Briefcase, CheckCircle2, Info, Clock, AlertCircle, Calculator, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function LeaveManagementPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Core Modules</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Leave Management</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          From simple sick leave to complex maternity and tenure-based accruals, manage the full lifecycle of employee absences.
        </p>
      </header>

      <Tabs defaultValue="filing" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="filing">Filing Requests</TabsTrigger>
          <TabsTrigger value="ledger">Ledger & History</TabsTrigger>
          <TabsTrigger value="accrual">Accrual Logic</TabsTrigger>
        </TabsList>

        <TabsContent value="filing" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Submitting a Request</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Employees can file for leave via their personal dashboard. They must specify a <strong>Leave Type</strong>, <strong>Start/End Date</strong>, and optional <strong>Reason</strong> or <strong>Attachment</strong> (e.g., Medical Certificate).
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/leave-request-form.png" alt="Leave Request Form" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">The Immutable Ledger</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Every leave transaction (accruals, usage, carry-over) is recorded in an immutable ledger. This ensures a transparent audit trail for both employee and payroll.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/leave-ledger.png" alt="Leave Ledger" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accrual" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Automated Calculations</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The system automatically calculates available balances based on the current <strong>Policy Configuration</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <Calculator className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm font-bold text-gray-900">Proration</p>
                  <p className="text-xs text-gray-500 leading-relaxed">System calculates exact days for mid-month joiners based on working days.</p>
                </Card>
                <Card className="p-4 border">
                  <History className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm font-bold text-gray-900">Historical Tracking</p>
                  <p className="text-xs text-gray-500 leading-relaxed">View balance changes over time to resolve disputes.</p>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

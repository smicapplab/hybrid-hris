import React from "react";
import { Banknote, FileText, CheckCircle2, Info, Clock, AlertCircle, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function PayrollPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Financials</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Banknote className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Payroll Processing</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Automate salary calculations, tax withholdings, and payslip generation with precise ledger integration.
        </p>
      </header>

      <Tabs defaultValue="run" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="run">Running Payroll</TabsTrigger>
          <TabsTrigger value="components">Payroll Components</TabsTrigger>
          <TabsTrigger value="payslips">Payslips & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">A</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Earnings & Taxation</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Define the nature of each pay component to ensure accurate tax withholding and statutory compliance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm">Taxable Income</span>
                  </div>
                  <p className="text-xs text-gray-500">Included in the withholding tax calculation base (e.g., Basic Pay, Overtime, Taxable Allowances).</p>
                </Card>
                <Card className="p-4 border shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm">De Minimis (Non-taxable)</span>
                  </div>
                  <p className="text-xs text-gray-500">Facilities or privileges of relatively small value, exempt from tax within certain limits (e.g., Rice Subsidy, Medical Allowance).</p>
                </Card>
              </div>
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">B</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Statutory Contributions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The system automatically calculates deductions for social security, health insurance, and provincial fund contributions based on active contribution tables.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/payroll-components.png" alt="Payroll Components" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="run" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Initiate Payroll Batch</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Navigate to <strong>Payroll &rarr; Batches</strong> and click <strong>Create New Batch</strong>. Select the pay period (e.g., Monthly, Semi-monthly).
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/payroll-batch-create.png" alt="Payroll Batch Create" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Review Adjustments & Overtime</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The system automatically pulls approved attendance, overtime, and expense claims. Review individual line items for accuracy.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/payroll-adjustments.png" alt="Payroll Adjustments" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Calculate & Commit</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Execute the calculation engine. Once verified, <strong>Commit</strong> the batch to freeze the data and initiate the bank transfer workflow.
              </p>
              <Card className="bg-blue-50/30 border-blue-100 mb-8">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Audit Log Created</p>
                      <p className="text-xs text-blue-800/80 leading-relaxed">
                        Committing a batch creates a permanent record in the financial ledger, preventing any further changes to that pay period.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Publish Payslips</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Click <strong>Release Payslips</strong> to make them available to employees on their personal dashboards and trigger email notifications.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/payroll-payslip-release.png" alt="Payroll Payslip Release" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Download Payroll Register</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Generate the <strong>Payroll Register (PDF/CSV)</strong> for internal record-keeping and bank upload files for direct deposit processing.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-12 text-center mb-8 text-gray-400 italic">
                <FileText className="w-12 h-12 text-blue-600 mb-4" />
                <p className="text-sm font-semibold text-blue-900">Payroll Cycle Complete</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

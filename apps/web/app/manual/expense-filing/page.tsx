import React from "react";
import { Receipt, CheckCircle2, Info, Camera, CreditCard, Landmark, ClipboardList, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function ExpenseFilingPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">Financials</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Module Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="w-8 h-8 text-emerald-700" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Expense Filing</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Streamline reimbursement workflows with multi-currency support, tax categorization, and automated approval chains.
        </p>
      </header>

      <Tabs defaultValue="submission" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="submission">Submission & Flow</TabsTrigger>
          <TabsTrigger value="reimbursement">Reimbursement Logic</TabsTrigger>
        </TabsList>

        <TabsContent value="submission" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Creating an Expense Report</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Group multiple expenses into a single <strong>Report</strong> for easier approval. Every line item must have a <strong>Category</strong> (e.g., Travel, Software, Meals) and a <strong>Receipt Attachment</strong>.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/expense-report-form.png" alt="Expense Report Form" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Receipt Verification (OCR)</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The system automatically parses receipt metadata (Date, Amount, Vendor) to prevent manual entry errors and detect potential fraud.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <Camera className="w-4 h-4 text-emerald-700 mb-2" />
                  <p className="text-sm font-bold">Digital Capture</p>
                  <p className="text-[10px] text-gray-500">Scan via mobile app or upload PDF invoices.</p>
                </Card>
                <Card className="p-4 border">
                  <ClipboardList className="w-4 h-4 text-emerald-700 mb-2" />
                  <p className="text-sm font-bold">Audit Checks</p>
                  <p className="text-[10px] text-gray-500">Auto-flag duplicates and policy violations.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reimbursement" className="space-y-12 mt-0">
          <div className="relative pl-12 text-center text-gray-400 italic py-10">
            <Landmark className="w-12 h-12 text-emerald-700 mx-auto mb-4" />
            <p className="text-sm font-semibold text-emerald-900 uppercase">Settlement Integration</p>
            <p className="text-xs mt-2">Approved expenses are automatically pushed to the next Payroll cycle as non-taxable reimbursements.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

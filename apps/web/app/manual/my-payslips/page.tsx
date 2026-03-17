"use client";

import React from "react";
import { FileBadge, Download, CheckCircle2, Info, Calendar, Landmark, Eye, History, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function MyPayslipsPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Employee Center</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Financial Records</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <FileBadge className="w-8 h-8 text-emerald-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Payslips</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Access your full earnings history, download digital payslips, and understand your compensation breakdown in real-time.
        </p>
      </header>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="current">Latest Statement</TabsTrigger>
          <TabsTrigger value="history">Historical Archive</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Viewing Your Latest Payslip</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your latest statement is released automatically according to the payroll schedule. You can view a detailed breakdown of <strong>Earnings</strong>, <strong>Deductions</strong>, and <strong>Taxes</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="p-4 border">
                  <Eye className="w-4 h-4 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold">Live Preview</p>
                  <p className="text-[10px] text-gray-500">Interactive breakdown of every line item.</p>
                </Card>
                <Card className="p-4 border">
                  <Download className="w-4 h-4 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold">PDF Download</p>
                  <p className="text-[10px] text-gray-500">Tamper-proof digital copies for your records.</p>
                </Card>
                <Card className="p-4 border">
                  <Landmark className="w-4 h-4 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold">Bank Details</p>
                  <p className="text-[10px] text-gray-500">Verify the destination account for your net pay.</p>
                </Card>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-payslip-current.png" alt="My Payslip Current" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payroll Archive</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Filter and search through your entire history of employment compensation. Useful for loan applications and tax filings.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-payslip-history.png" alt="My Payslip History" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

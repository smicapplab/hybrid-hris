import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Layers, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ManualOverviewPage() {
  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">System Overview</h1>
        </div>
        <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
          Hybrid HRIS is a specialized Human Resource Information System designed for organizations that require both flexibility and rigorous financial-grade integrity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <Card className="border-blue-100 bg-blue-50/50">
            <CardHeader>
              <ShieldCheck className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Immutable Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Balances for leaves and budgets are derived from append-only ledgers, making the system tamper-proof and fully auditable.</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardHeader>
              <Layers className="w-8 h-8 text-emerald-600 mb-2" />
              <CardTitle>Modular Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Clean separation between business domains (Leave, Expense, Budget) allows for rapid scaling and decoupled maintenance.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <hr className="border-gray-100" />

      <section id="getting-started">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Getting Started</h2>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Log in to the system using your organizational credentials. For development and testing environment, use the provided administrator account.
        </p>

        <Card className="bg-gray-900 text-white overflow-hidden border-none shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Environment: Development</span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-none">Live Access</Badge>
            </div>
            <div className="space-y-4 font-mono text-base">
              <div className="flex gap-4">
                <span className="text-blue-400 w-20 shrink-0">URL:</span>
                <span className="text-gray-300">http://localhost:3000</span>
              </div>
              <div className="flex gap-4">
                <span className="text-blue-400 w-20 shrink-0">Email:</span>
                <span className="text-gray-300">admin@hybrid-hris.local</span>
              </div>
              <div className="flex gap-4">
                <span className="text-blue-400 w-20 shrink-0">Password:</span>
                <span className="text-gray-300">Admin123!</span>
              </div>
            </div>
          </div>
          <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-white/10">
            <span className="text-sm text-gray-400 italic">Click the button below to proceed to the User Management guide.</span>
            <Button variant="secondary" size="sm" className="gap-2" asChild>
              <Link href="/manual/user-management">
                Next Guide <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </Card>

        <div className="mt-10 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
          <img src="/screenshots/login.png" alt="Login Page" className="w-full" />
        </div>
      </section>
    </div>
  );
}

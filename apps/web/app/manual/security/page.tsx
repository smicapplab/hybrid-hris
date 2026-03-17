import React from "react";
import { ShieldCheck, Lock, Database, Zap, RefreshCcw, ShieldAlert, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SecurityPage() {
  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Technical Core</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">System Architecture</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Hardened Security</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Hybrid HRIS implements financial-grade integrity through database-level constraints and immutable audit logs.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Database className="w-24 h-24 text-blue-600" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <RefreshCcw className="w-5 h-5 text-blue-600" />
              Immutable Ledgers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 text-sm leading-relaxed">
            Unlike traditional HRIS tables where balances are simply overwritten, Hybrid HRIS uses <strong>Append-Only Ledgers</strong>. Every leave credit, deduction, or budget allocation is a unique row. Balances are derived by summing these atomic events, ensuring perfect historical auditability and zero data loss.
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Zap className="w-24 h-24 text-amber-600" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Temporal Integrity
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 text-sm leading-relaxed">
            The system utilizes PostgreSQL <code>EXCLUDE</code> constraints with the <code>btree_gist</code> extension. This prevents logical corruption at the source—for example, an employee can never be assigned to two different leave policies during the same time period, as the database will reject the transaction before it even reaches the application layer.
          </CardContent>
        </Card>
      </div>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Authentication</h2>
        
        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
               <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Stateful Session Re-validation</h4>
              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                The application does not rely solely on stateless JWT claims for roles. Every sensitive request is re-validated against the database to ensure that if a user's role is revoked or their manager changes, the system reflects the change instantly without waiting for a token to expire.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
               <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Schema-First Authorization</h4>
              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                Permissions are tightly coupled with the organization unit hierarchy. An Approver can only see data belonging to their descendant nodes, enforced via Row-Level Security (RLS) patterns in the data access layer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="bg-gray-900 text-gray-100 border-none shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Maximum Data Integrity</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            Our architecture is designed to protect your most sensitive organizational data through rigorous validation and permanent audit trails.
          </p>
          <div className="inline-flex gap-2">
             <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none">BTree GIST Enabled</Badge>
             <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none">Ledger Derived</Badge>
             <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none">Postgres RLS</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

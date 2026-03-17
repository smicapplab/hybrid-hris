import React from "react";
import { Network, GitFork, TriangleDashed, Users, UserPlus, Briefcase, ShieldCheck, ClipboardCheck, UserCog, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function OrgUnitsPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Administration</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Infrastructure Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Network className="w-8 h-8 text-slate-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Organizational Units</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Model your company's hierarchy, manage personnel assignments, and control headcount via the integrated Plantilla and Manpower Request systems.
        </p>
      </header>

      <Tabs defaultValue="hierarchy" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="hierarchy">Hierarchy & Units</TabsTrigger>
          <TabsTrigger value="personnel">Leadership & Members</TabsTrigger>
          <TabsTrigger value="plantilla">Plantilla & Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">The Org Tree</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Navigate to <strong>Administration &rarr; Org Units</strong>. Use the tree view to visualize parent-child relationships between units.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/org-tree-view.png" alt="Hierarchical Org Tree View" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Units & Sub-Units</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Click <strong>+ Add Unit</strong>. To create a <strong>Sub-Unit</strong>, simply select the desired <strong>Parent Unit</strong> from the dropdown. Units without a parent are treated as root nodes.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/org-tree-sub.png" alt="Hierarchical Org Tree View" className="w-full" />
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Editing & Moving Units</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Click the <strong>Edit icon</strong> to modify details or <strong>Re-Parent</strong> a unit, moving it and all its children to a new location in the tree.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/org-tree-edit.png" alt="Hierarchical Org Tree View" className="w-full" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personnel" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Leadership: Unit Heads & Managers</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Assign **Leadership** roles to designate the person responsible for the unit.
              </p>
              <Card className="bg-slate-50 border-slate-100 mb-8">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Crown className="w-10 h-10 text-slate-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">What is Leadership for?</p>
                      <ul className="text-xs text-slate-700 mt-2 space-y-2 list-disc pl-4">
                        <li><strong>Approval Chains:</strong> Primary approver for leave, expenses, and overtime for all unit members.</li>
                        <li><strong>Budget Oversight:</strong> Responsible for managing the unit's financial allocation in the Budget Matrix.</li>
                        <li><strong>Performance:</strong> Primary evaluator for skills and training progress within the unit.</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Separator />
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/org-unit-leaders.png" alt="Hierarchical Org Tree View" className="w-full" />
              </div>
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Managing Unit Members</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The **Members** section displays all personnel currently assigned to the unit.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    <UserPlus className="w-4 h-4 text-slate-600" />
                    Add Members
                  </div>
                  <p className="text-xs text-gray-500">Click <strong>+ Assign Member</strong> to move existing employees into this unit.</p>
                </Card>
                <Card className="p-4 border">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    <UserCog className="w-4 h-4 text-slate-600" />
                    Member Movement
                  </div>
                  <p className="text-xs text-gray-500">Employees are always linked to exactly one Org Unit for reporting purposes.</p>
                </Card>
              </div>
              <Separator />
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/org-unit-members.png" alt="Hierarchical Org Tree View" className="w-full" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plantilla" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">6</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Plantilla & Headcount Control</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The **Plantilla** (Headcount) defines the approved number of **Positions** for a specific unit.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <p className="text-sm font-bold text-slate-900">Position Allocation</p>
                  <p className="text-xs text-slate-500 mt-1">Specify how many "Junior Developers" or "Managers" the unit is allowed to have.</p>
                </Card>
                <Card className="p-4 border bg-amber-50">
                  <p className="text-sm font-bold text-amber-900">Approval Workflow</p>
                  <p className="text-xs text-amber-700/80 mt-1">Increasing the Plantilla requires executive approval before new hires can be onboarded.</p>
                </Card>
              </div>
              <Separator />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">7</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manpower Requests</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                When a unit needs to hire beyond their current Plantilla or replace long-term vacancies, they must submit a **Manpower Request**.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/manpower.png" alt="Manpower Request" className="w-full" />
              </div>

              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/manpower-request.png" alt="Manpower Request" className="w-full" />
              </div>
            </div>
          </div>

          <div className="relative pl-12 text-center text-gray-400 italic">
            <TriangleDashed className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Organizational Structure Synchronized</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

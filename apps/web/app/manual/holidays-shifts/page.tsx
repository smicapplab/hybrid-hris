import React from "react";
import { Palmtree, Calendar, CheckCircle2, Info, Clock, MapPin, Grid, Layers, ListChecks, CalendarRange, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function HolidaysShiftsPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">Operations</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Planning Guide</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Palmtree className="w-8 h-8 text-amber-700" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Holidays & Shifts</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Configure the temporal framework of your company. Manage official holidays and define operational shift templates for your workforce.
        </p>
      </header>

      <Tabs defaultValue="holidays" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="holidays">Corporate Holidays</TabsTrigger>
          <TabsTrigger value="shifts">Shift Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="holidays" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-amber-700 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Holiday Calendars & Multipliers</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Holidays are categorized into **Regular** and **Special (Non-Working)** days, each affecting payroll calculations differently according to labor laws.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border-l-4 border-l-red-600 bg-red-50/50">
                  <p className="text-sm font-bold text-red-900">Regular Holidays (200%)</p>
                  <p className="text-xs text-red-700 mt-1">Working on these days earns 200% of the daily rate. Even if not working, the employee receives 100% pay.</p>
                </Card>
                <Card className="p-4 border-l-4 border-l-amber-600 bg-amber-50/50">
                  <p className="text-sm font-bold text-amber-900">Special Holidays (130%)</p>
                  <p className="text-xs text-amber-700 mt-1">Working on these days earns a 30% premium (130% total). "No work, no pay" applies unless the policy states otherwise.</p>
                </Card>
              </div>

              <div className="bg-slate-50 border p-4 rounded-lg mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="w-5 h-5 text-amber-700" />
                  <p className="text-sm font-bold text-gray-900">Payroll Multiplier Logic</p>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong>Regular Work:</strong> Daily Rate × Multiplier × Hours Worked</li>
                  <li><strong>Rest Day + Holiday:</strong> Additional 30% premium added on top of the holiday multiplier.</li>
                  <li><strong>Night Shift + Holiday:</strong> Night differential (usually 10%) is applied after the holiday multiplier.</li>
                </ul>
              </div>

              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-amber-700 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Shift Template Engine</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Create reusable shift patterns (e.g., Morning Shift, Night Shift, Weekend Rota).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <Clock className="w-4 h-4 text-amber-700 mb-2" />
                  <p className="text-sm font-bold">Core Hours</p>
                  <p className="text-xs text-gray-500">Define start, end, and mandatory break times.</p>
                </Card>
                <Card className="p-4 border">
                  <Layers className="w-4 h-4 text-amber-700 mb-2" />
                  <p className="text-sm font-bold">Differential Rules</p>
                  <p className="text-xs text-gray-500">Auto-calculate night shift premiums and hazard pay.</p>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

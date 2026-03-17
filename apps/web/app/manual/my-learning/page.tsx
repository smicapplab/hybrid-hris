import React from "react";
import { GraduationCap, BookOpen, CheckCircle2, Info, Calendar, History, ListChecks, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function MyLearningPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Employee Center</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Continuous Development</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="w-8 h-8 text-orange-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Learning</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Track your course enrollments, certification deadlines, and build a verifiable history of your professional growth.
        </p>
      </header>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upcoming">Upcoming & Enrolled</TabsTrigger>
          <TabsTrigger value="history">Learning History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Active Learning Courses</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Courses you are currently enrolled in, including mandatory compliance training and self-enrolled development programs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border bg-orange-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-orange-600">Mandatory</Badge>
                    <span className="text-[10px] text-orange-600 font-bold">5 Days Left</span>
                  </div>
                  <p className="text-sm font-bold">Cybersecurity Awareness 2024</p>
                  <p className="text-xs text-gray-500 mt-1">Foundations of digital safety.</p>
                </Card>
                <Card className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Optional</Badge>
                    <span className="text-[10px] text-gray-400">Self-Paced</span>
                  </div>
                  <p className="text-sm font-bold">Advanced React Patterns</p>
                  <p className="text-xs text-gray-500 mt-1">Optimizing component lifecycle.</p>
                </Card>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-learning-active.png" alt="My Learning Active" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transcript & Certifications</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Access your completed courses and download proof of certification for external records.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-learning-history.png" alt="My Learning History" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

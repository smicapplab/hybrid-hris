import React from "react";
import { UserCircle, CheckCircle2, Info, Camera, Fingerprint, MapPin, Phone, Mail, Award, TrendingUp, Star, CalendarCheck, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function MyProfilePage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-violet-600 border-violet-200 bg-violet-50">Employee Center</Badge>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">User Identity</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <UserCircle className="w-8 h-8 text-violet-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
          Manage your professional digital identity, personal details, and showcase your skill proficiency to the organization.
        </p>
      </header>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="schedule">Work Schedule</TabsTrigger>
          <TabsTrigger value="skills">My Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personal Data Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Keep your records up-to-date. Some fields (like Legal Name or Government IDs) may require HR verification before changes are applied.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="p-4 border">
                  <Phone className="w-4 h-4 text-violet-600 mb-2" />
                  <p className="text-sm font-bold">Contact Info</p>
                  <p className="text-xs text-gray-500">Phone numbers, personal email, and emergency contacts.</p>
                </Card>
                <Card className="p-4 border">
                  <MapPin className="w-4 h-4 text-violet-600 mb-2" />
                  <p className="text-sm font-bold">Address Details</p>
                  <p className="text-xs text-gray-500">Current and permanent residential addresses.</p>
                </Card>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-profile-edit.png" alt="My Profile Edit" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Work Schedule</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Stay informed about your assigned shifts, including both current active schedules and upcoming rotations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-green-700">
                    <Clock className="w-4 h-4" />
                    Active Schedule
                  </div>
                  <p className="text-lg font-extrabold text-gray-900">Morning Shift (08:00 - 17:00)</p>
                  <p className="text-xs text-gray-500 mt-1 italic">Effective: Mar 1 - Mar 31</p>
                </Card>

                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-blue-700">
                    <CalendarCheck className="w-4 h-4" />
                    Upcoming Rotation
                  </div>
                  <p className="text-lg font-extrabold text-gray-900">Afternoon Shift (14:00 - 23:00)</p>
                  <p className="text-xs text-gray-500 mt-1 italic">Starts: Apr 1</p>
                </Card>
              </div>

              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-profile-schedule.png" alt="My Profile Schedule" />
              </div>
              <Separator />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="skills" className="space-y-12 mt-0">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Skill Proficiency</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                View your current skill set as evaluated by managers and your own self-assessments.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="p-4 border text-center">
                  <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-xs font-bold">Self-Assessment</p>
                  <p className="text-[10px] text-gray-500">Declare your own proficiency levels.</p>
                </Card>
                <Card className="p-4 border text-center">
                  <Award className="w-6 h-6 text-violet-600 mx-auto mb-2" />
                  <p className="text-xs font-bold">Verified Skills</p>
                  <p className="text-[10px] text-gray-500">Skills approved by your manager.</p>
                </Card>
                <Card className="p-4 border text-center">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-bold">Missing Goals</p>
                  <p className="text-[10px] text-gray-500">Skills required for your next rank.</p>
                </Card>
              </div>
              <div className="rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col mb-8">
                <img src="/screenshots/my-profile-skills.png" alt="My Profile Skills" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

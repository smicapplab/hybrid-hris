'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Calendar, MapPin, ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrainingEnrollmentDialog } from './training-enrollment-dialog';
import Link from 'next/link';

interface UpcomingSchedule {
  id: string;
  programId: string;
  programTitle: string;
  location: string | null;
  startAt: string;
  endAt: string;
  status: string;
}

export default function UpcomingTrainings() {
  const [schedules, setSchedules] = useState<UpcomingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<UpcomingSchedule[]>('/training/schedules/upcoming');
        setSchedules(data.slice(0, 5)); // Show only top 5
      } catch (err) {
        console.error('Failed to load upcoming trainings', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Consistent Header with Gradient */}
        <div className="px-4 py-3 border-b bg-linear-to-r from-blue-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Learning & Development</h3>
          </div>
          <Link href="/me/my-trainings" className="text-xs text-blue-600 hover:underline font-medium">
            My Portfolio
          </Link>
        </div>

        {schedules.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground font-medium italic">No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <div className="divide-y divide-orange-50 max-h-100 overflow-y-auto">
            {schedules.map((sch) => (
              <div
                key={sch.id}
                className="group flex items-center justify-between p-3 px-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedScheduleId(sch.id);
                  setDialogOpen(true);
                }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors leading-tight">
                    {sch.programTitle}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {new Date(sch.startAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {sch.location || 'Remote'}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TrainingEnrollmentDialog
        scheduleId={selectedScheduleId}
        open={dialogOpen}
        onOpenChangeAction={setDialogOpen}
      />
    </>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Info, Clock, Library, Trash2 } from 'lucide-react';
import { TrainingProgram, TrainingSchedule, TrainingScheduleSession } from '@/types/training.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PublicScheduleDetails extends TrainingSchedule {
  program: TrainingProgram;
  sessions: TrainingScheduleSession[];
  attendeeCount: number;
  myEnrollment: { id: string; status: string } | null;
  attendees: { id: string; firstName: string; lastName: string; orgUnitName: string | null }[];
}

type Props = {
  scheduleId: string;
  onUnenrollAction: () => void;
};

export function TrainingDetailPanel({ scheduleId, onUnenrollAction }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<PublicScheduleDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<PublicScheduleDetails>(`/training/schedules/${scheduleId}/public`);
      setData(result);
    } catch {
      toast({ title: 'Failed to load training details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [scheduleId, toast]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function handleConfirmUnenroll() {
    try {
      setActionLoading(true);
      await apiFetch(`/training/schedules/${scheduleId}/enroll`, { method: 'DELETE' });
      toast({ title: 'Successfully un-enrolled', variant: 'success' });
      setShowUnenrollConfirm(false);
      onUnenrollAction();
    } catch {
      toast({ title: 'Failed to un-enroll', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading details...</p>
      </div>
    );
  }

  if (!data) return null;

  const isEnrolled = data.myEnrollment?.status === 'ENROLLED';
  const isUpcoming = new Date(data.startAt) >= new Date();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6 p-6 rounded-2xl border bg-card shadow-sm">
        <div className="flex gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Library className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{data.program.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">{data.program.type}</Badge>
              {data.program.isMandatory && (
                <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">Mandatory</Badge>
              )}
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">{data.status}</Badge>
            </div>
          </div>
        </div>
        {isEnrolled && isUpcoming && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 shadow-sm font-bold text-xs uppercase"
            disabled={actionLoading}
            onClick={() => setShowUnenrollConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5" /> Un-enroll
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border bg-muted/20 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Location</span>
              </div>
              <p className="text-sm font-bold truncate">{data.location || 'Remote/Online'}</p>
            </div>
            <div className="p-4 rounded-2xl border bg-muted/20 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Attendance</span>
              </div>
              <p className="text-sm font-bold">
                {data.attendeeCount} / {data.capacity || '∞'} Seats
              </p>
            </div>
            <div className="p-4 rounded-2xl border bg-muted/20 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Starts On</span>
              </div>
              <p className="text-sm font-bold">
                {new Date(data.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4" /> About Program
            </h3>
            <div className="p-5 rounded-xl border bg-card leading-relaxed text-sm text-muted-foreground whitespace-pre-wrap">
              {data.program.description || 'No description available for this training program.'}
            </div>
          </div>

          {/* Sessions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Training Schedule
            </h3>
            <div className="space-y-3">
              {data.sessions.length === 0 ? (
                <div className="p-4 rounded-xl border bg-card text-sm font-medium">
                  Single session from {new Date(data.startAt).toLocaleTimeString()} to {new Date(data.endAt).toLocaleTimeString()}
                </div>
              ) : (
                data.sessions.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded border bg-card hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center text-xs font-bold border border-primary/10">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{s.title || `Session ${idx + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.startAt).toLocaleDateString()} @ {new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase">{s.location || 'Default'}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4" /> Attendees ({data.attendees.length})
        </h3>
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="h-10 text-[10px] font-bold uppercase">Employee</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase text-right">Dept</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.attendees.map((a) => (
                <TableRow key={a.id} className={cn(a.id === data.myEnrollment?.id && "bg-primary/5")}>
                  <TableCell className="py-3 text-xs font-semibold">
                    {a.firstName} {a.lastName}
                    {a.id === data.myEnrollment?.id && (
                      <span className="ml-2 text-[9px] text-primary bg-primary/10 px-1 rounded">You</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground text-right">{a.orgUnitName || '—'}</TableCell>
                </TableRow>
              ))}
              {data.attendees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-xs text-muted-foreground italic">
                    No other attendees yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog 
        open={showUnenrollConfirm}
        onOpenChange={setShowUnenrollConfirm}
        title="Un-enroll from Training"
        description="Are you sure you want to cancel your enrollment for this session? This will free up your seat for others."
        onConfirm={handleConfirmUnenroll}
        variant="destructive"
        confirmText="Un-enroll"
      />
    </div>
  );
}

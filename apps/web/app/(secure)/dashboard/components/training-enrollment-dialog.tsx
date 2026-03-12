'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Info, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { TrainingProgram, TrainingSchedule, TrainingScheduleSession } from '@/types/training.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PublicScheduleDetails extends TrainingSchedule {
  program: TrainingProgram;
  sessions: TrainingScheduleSession[];
  attendeeCount: number;
  myEnrollment: { id: string; status: string } | null;
  attendees: { id: string; firstName: string; lastName: string; orgUnitName: string | null }[];
}

type Props = {
  scheduleId: string | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
};

export function TrainingEnrollmentDialog({ scheduleId, open, onOpenChangeAction }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<PublicScheduleDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!scheduleId || !open) return;
      try {
        setLoading(true);
        const result = await apiFetch<PublicScheduleDetails>(`/training/schedules/${scheduleId}/public`);
        setData(result);
      } catch {
        toast({ title: 'Failed to load details', variant: 'destructive' });
        onOpenChangeAction(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scheduleId, open, toast, onOpenChangeAction]);

  async function handleEnroll() {
    if (!scheduleId) return;
    try {
      setActionLoading(true);
      await apiFetch(`/training/schedules/${scheduleId}/enroll`, { method: 'POST' });
      toast({ title: 'Successfully enrolled!', variant: 'success' });
      // Refresh
      const result = await apiFetch<PublicScheduleDetails>(`/training/schedules/${scheduleId}/public`);
      setData(result);
    } catch (err) {
      toast({
        title: 'Enrollment failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!scheduleId) return;
    try {
      setActionLoading(true);
      await apiFetch(`/training/schedules/${scheduleId}/enroll`, { method: 'DELETE' });
      toast({ title: 'Enrollment cancelled', variant: 'success' });
      // Refresh
      const result = await apiFetch<PublicScheduleDetails>(`/training/schedules/${scheduleId}/public`);
      setData(result);
    } catch {
      toast({ title: 'Cancellation failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  if (!data && loading) return null;
  if (!data) return null;

  const isEnrolled = data.myEnrollment?.status === 'ENROLLED';
  const isFull = !!(data.capacity && data.attendeeCount >= data.capacity);

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden text-foreground">
        <DialogHeader className="px-6 pt-6 border-b pb-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold truncate">{data.program.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] uppercase font-bold">{data.program.type}</Badge>
                {data.program.isMandatory && <Badge variant="destructive" className="text-[10px] uppercase font-bold">Mandatory</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-3 rounded-xl border bg-card space-y-1 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
              </div>
              <p className="text-sm font-semibold truncate">{data.location || 'Remote/TBA'}</p>
            </div>
            <div className="p-3 rounded-xl border bg-card space-y-1 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Availability</span>
              </div>
              <p className="text-sm font-semibold">
                {data.attendeeCount} / {data.capacity || '∞'} Seats Filled
              </p>
            </div>
            <div className="p-3 rounded-xl border bg-card space-y-1 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Schedule</span>
              </div>
              <p className="text-sm font-semibold">
                {new Date(data.startAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <Info className="w-4 h-4" />
              <h3 className="text-sm uppercase tracking-widest">About this Program</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {data.program.description || 'No description available.'}
            </p>
          </div>

          {/* Sessions */}
          {data.sessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sessions</h3>
              <div className="space-y-2">
                {data.sessions.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-[10px] font-bold border">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{s.title || `Session ${idx + 1}`}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(s.startAt).toLocaleDateString()} @ {new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background">{s.location || data.location || 'Remote'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendees */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Attendees ({data.attendees.length})</h3>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-9 text-[10px] uppercase font-bold">Name</TableHead>
                    <TableHead className="h-9 text-[10px] uppercase font-bold">Department</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.attendees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6 text-xs text-muted-foreground italic">
                        Be the first to enroll!
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.attendees.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="py-2 text-xs font-medium">{a.firstName} {a.lastName}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">{a.orgUnitName || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isEnrolled ? (
              <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs uppercase tracking-tight">
                <CheckCircle2 className="w-4 h-4" /> You are enrolled
              </div>
            ) : isFull ? (
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-tight">
                <XCircle className="w-4 h-4" /> Session is full
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic max-w-50">
                Enrolling will add this to your schedule and notify the organizer.
              </p>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>Close</Button>
            {isEnrolled ? (
              <Button variant="destructive" disabled={actionLoading} onClick={handleCancel}>
                Cancel Enrollment
              </Button>
            ) : (
              <Button disabled={actionLoading || isFull} onClick={handleEnroll}>
                Enroll Now
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

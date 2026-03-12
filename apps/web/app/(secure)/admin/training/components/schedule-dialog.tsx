'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/ui/numeric-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TrainingSchedule, TrainingScheduleSession } from '@/types/training.types';
import { Plus, Calendar as CalendarIcon, MapPin, Trash2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  programId: string;
  scheduleId?: string | null;
  onSuccessAction: () => void;
};

export function ScheduleDialog({ open, onOpenChangeAction, programId, scheduleId, onSuccessAction }: Props) {
  const { toast } = useToast();
  const isEdit = !!scheduleId;

  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState<number>(0);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [externalTrainer, setExternalTrainer] = useState('');

  // Sessions
  const [sessions, setSessions] = useState<{ title: string; location: string; startAt: string; endAt: string }[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      if (scheduleId && open) {
        try {
          const data = await apiFetch<TrainingSchedule & { sessions: TrainingScheduleSession[] }>(`/training/schedules/${scheduleId}`);
          setLocation(data.location ?? '');
          setCapacity(data.capacity ?? 0);
          setStartAt(new Date(data.startAt).toISOString().slice(0, 16));
          setEndAt(new Date(data.endAt).toISOString().slice(0, 16));
          setStatus(data.status);
          setExternalTrainer(data.externalTrainer ?? '');
          setSessions(data.sessions?.map(s => ({
            title: s.title ?? '',
            location: s.location ?? '',
            startAt: new Date(s.startAt).toISOString().slice(0, 16),
            endAt: new Date(s.endAt).toISOString().slice(0, 16),
          })) ?? []);
        } catch {
          toast({ title: 'Failed to load schedule', variant: 'destructive' });
        }
      } else {
        setLocation('');
        setCapacity(0);
        setStartAt('');
        setEndAt('');
        setStatus('SCHEDULED');
        setExternalTrainer('');
        setSessions([]);
      }
    }
    loadSchedule();
  }, [scheduleId, open, toast]);

  const addSession = () => {
    setSessions([...sessions, { title: `Session ${sessions.length + 1}`, location: '', startAt: '', endAt: '' }]);
  };

  const removeSession = (idx: number) => setSessions(sessions.filter((_, i) => i !== idx));

  const updateSession = (idx: number, field: string, value: string) => {
    setSessions(sessions.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  async function handleSubmit() {
    if (!startAt || !endAt) return;

    try {
      setLoading(true);
      const body = {
        programId,
        location: location.trim() || null,
        capacity: capacity > 0 ? capacity : null,
        startAt,
        endAt,
        status,
        externalTrainer: externalTrainer.trim() || null,
        sessions: sessions.filter(s => s.startAt && s.endAt),
      };

      if (isEdit) {
        await apiFetch(`/training/schedules/${scheduleId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast({ title: 'Schedule updated', variant: 'success' });
      } else {
        await apiFetch('/training/schedules', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast({ title: 'Schedule created', variant: 'success' });
      }

      onOpenChangeAction(false);
      onSuccessAction();
    } catch (err) {
      toast({
        title: 'Failed to save schedule',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-4xl flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 text-foreground">
          <DialogTitle>{isEdit ? 'Edit Schedule' : 'New Schedule'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 text-foreground">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Main Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 302" />
            </div>
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <NumericInput value={capacity} onChangeAction={setCapacity} min={0} placeholder="Unlimited" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Date/Time</Label>
              <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date/Time</Label>
              <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>External Trainer</Label>
              <Input value={externalTrainer} onChange={e => setExternalTrainer(e.target.value)} placeholder="Name (optional)" />
            </div>
          </div>

          {/* Sessions Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Granular Sessions</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSession} className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Session
              </Button>
            </div>

            {sessions.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-3 rounded-lg border border-dashed">
                Optional: Use this for multi-day schedules. If empty, the main start/end range will be used as a single session.
              </p>
            )}

            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-xl bg-muted/10 items-end">
                  <div className="md:col-span-12 space-y-1">
                    <Label className="text-[10px]">Session Title</Label>
                    <Input className="h-8 text-xs bg-background" value={session.title} onChange={e => updateSession(idx, 'title', e.target.value)} />
                  </div>
                  <div className="md:col-span-5 space-y-1">
                    <Label className="text-[10px]">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input className="h-8 text-xs pl-7 bg-background" value={session.location} onChange={e => updateSession(idx, 'location', e.target.value)} />
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[10px]">Start</Label>
                    <Input type="datetime-local" className="h-8 text-xs px-1 bg-background" value={session.startAt} onChange={e => updateSession(idx, 'startAt', e.target.value)} />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[10px]">End</Label>
                    <Input type="datetime-local" className="h-8 text-xs px-1 bg-background" value={session.endAt} onChange={e => updateSession(idx, 'endAt', e.target.value)} />
                  </div>
                  <div className="md:col-span-1 flex justify-end pb-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeSession(idx)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10">
          <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !startAt || !endAt}>
            {loading ? 'Saving…' : isEdit ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

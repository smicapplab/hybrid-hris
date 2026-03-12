'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Calendar, MapPin, Users, Pencil, Clock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TrainingSchedule } from '@/types/training.types';
import { ScheduleDialog } from './schedule-dialog';

type Props = {
  programId: string;
  programTitle: string;
  onManageAttendeesAction: (scheduleId: string, title: string) => void;
};

export function ScheduleList({ programId, programTitle, onManageAttendeesAction }: Props) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<TrainingSchedule[]>(`/training/programs/${programId}/schedules`);
      setSchedules(result);
    } catch (err) {
      toast({
        title: 'Failed to load schedules',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [programId, toast]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Program Instances
        </h3>
        <Button size="sm" className="gap-2 h-8" onClick={() => {
          setEditingScheduleId(null);
          setDialogOpen(true);
        }}>
          <Plus className="w-3.5 h-3.5" /> Add Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {schedules.length === 0 && !loading && (
          <div className="py-12 text-center rounded-xl border border-dashed bg-muted/20">
            <Calendar className="w-8 h-8 text-muted-foreground opacity-50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No schedules found for this program.</p>
          </div>
        )}

        {schedules.map((sch) => (
          <div key={sch.id} className="group p-4 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">
                      {new Date(sch.startAt).toLocaleDateString(undefined, { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                      {new Date(sch.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sch.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Badge variant={sch.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-[10px] h-5 uppercase">
                    {sch.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{sch.location || 'No location set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>Capacity: {sch.capacity || 'Unlimited'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Trainer: {sch.externalTrainer || 'Internal'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={() => onManageAttendeesAction(sch.id, programTitle)}>
                  <UserCheck className="w-3.5 h-3.5" /> Attendees
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 self-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                  setEditingScheduleId(sch.id);
                  setDialogOpen(true);
                }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ScheduleDialog
        open={dialogOpen}
        onOpenChangeAction={setDialogOpen}
        programId={programId}
        scheduleId={editingScheduleId}
        onSuccessAction={loadSchedules}
      />
    </div>
  );
}

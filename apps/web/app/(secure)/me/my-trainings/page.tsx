'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { GraduationCap } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { TrainingListPanel } from './components/training-list-panel';
import { TrainingDetailPanel } from './components/training-detail-panel';

export interface MyTraining {
  id: string;
  programId: string;
  programTitle: string;
  programType: string;
  isMandatory: boolean;
  enrollmentStatus: string;
  location: string | null;
  capacity: number | null;
  startAt: string;
  endAt: string;
  status: string;
}

export default function MyTrainingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [trainings, setTrainings] = useState<MyTraining[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<MyTraining[]>('/training/my-trainings');
      setTrainings(result);

      setSelectedId((current) => {
        if (result.length > 0 && !current) return result[0].id;
        return current;
      });
    } catch (err) {
      toast({
        title: 'Failed to load trainings',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      loadTrainings();
    }
  }, [user, loadTrainings]);

  if (!user) return null;

  const selected = trainings.find((t) => t.id === selectedId);

  return (
    <div className="p-6 h-[calc(100vh-(--spacing(16)))] flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">My Trainings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your professional development, enrolled sessions, and training history.
        </p>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 rounded-lg border bg-background">
        <ResizablePanel defaultSize={35} minSize={25}>
          <TrainingListPanel
            trainings={trainings}
            loading={loading}
            selectedId={selectedId}
            onSelectAction={setSelectedId}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65}>
          <div className="h-full overflow-y-auto p-5 bg-muted/5">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No training selected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a training from the list to view its details.
                  </p>
                </div>
              </div>
            ) : (
              <TrainingDetailPanel 
                scheduleId={selected.id}
                onUnenrollAction={loadTrainings}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

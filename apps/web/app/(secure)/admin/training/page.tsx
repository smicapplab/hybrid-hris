'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Library } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { TrainingProgram } from '@/types/training.types';
import { ProgramListPanel } from './components/program-list-panel';
import { ProgramDetailPanel } from './components/program-detail-panel';
import { AttendeeManagementPanel } from './components/attendee-management-panel';
import { ProgramDialog } from './components/program-dialog';

export default function TrainingManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // NEW: State for attendee management
  const [view, setView] = useState<{ type: 'program'; id: string } | { type: 'attendees'; scheduleId: string; programTitle: string }>({ type: 'program', id: '' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);

  const loadPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<TrainingProgram[]>('/training/programs');
      setPrograms(result);

      if (result.length > 0 && !selectedId) {
        setSelectedId(result[0].id);
        setView({ type: 'program', id: result[0].id });
      }
    } catch (err) {
      toast({
        title: 'Failed to load training programs',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedId, toast]);

  useEffect(() => {
    if (user) {
      loadPrograms();
    }
  }, [user, loadPrograms]);

  if (!user) return null;

  return (
    <div className="p-6 h-full flex flex-col gap-4 text-foreground">
      <div>
        <h1 className="text-xl font-bold">Training Catalog</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Design training programs and manage their associated skills and prerequisites.
        </p>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 rounded-lg border">
        <ResizablePanel defaultSize={30} minSize={20}>
          <ProgramListPanel
            programs={programs}
            loading={loading}
            selectedId={selectedId}
            onSelectAction={(id) => {
              setSelectedId(id);
              setView({ type: 'program', id });
            }}
            onAddAction={() => {
              setEditingProgram(null);
              setDialogOpen(true);
            }}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <div className="h-full overflow-y-auto p-5 bg-muted/5">
            {view.type === 'program' && selectedId ? (
              <ProgramDetailPanel 
                programId={selectedId}
                onEditAction={(prog) => {
                  setEditingProgram(prog);
                  setDialogOpen(true);
                }}
                onUpdateSuccessAction={loadPrograms}
                onManageAttendeesAction={(scheduleId, programTitle) => {
                  setView({ type: 'attendees', scheduleId, programTitle });
                }}
              />
            ) : view.type === 'attendees' ? (
              <AttendeeManagementPanel 
                scheduleId={view.scheduleId}
                programTitle={view.programTitle}
                onBackAction={() => setView({ type: 'program', id: selectedId! })}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Library className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No program selected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a program from the list to view its details and schedules.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <ProgramDialog
        open={dialogOpen}
        onOpenChangeAction={setDialogOpen}
        initialData={editingProgram}
        onSuccessAction={loadPrograms}
      />
    </div>
  );
}

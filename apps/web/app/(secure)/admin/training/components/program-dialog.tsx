'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TrainingProgram } from '@/types/training.types';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  initialData?: TrainingProgram | null;
  onSuccessAction: () => void;
};

export function ProgramDialog({ open, onOpenChangeAction, initialData, onSuccessAction }: Props) {
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [type, setType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [isMandatory, setIsMandatory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description ?? '');
        setObjectives(initialData.objectives ?? '');
        setType(initialData.type);
        setIsMandatory(initialData.isMandatory);
      } else {
        setTitle('');
        setDescription('');
        setObjectives('');
        setType('INTERNAL');
        setIsMandatory(false);
      }
    }
  }, [initialData, open]);

  async function handleSubmit() {
    if (!title.trim()) return;

    try {
      setLoading(true);
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        objectives: objectives.trim() || null,
        type,
        isMandatory,
      };

      if (isEdit) {
        await apiFetch(`/training/programs/${initialData!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast({ title: 'Program updated', variant: 'success' });
      } else {
        await apiFetch('/training/programs', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast({ title: 'Program created', variant: 'success' });
      }

      onOpenChangeAction(false);
      onSuccessAction();
    } catch (err) {
      toast({
        title: 'Failed to save program',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Training Program' : 'New Training Program'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-foreground">
          <div className="space-y-1.5">
            <Label>Program Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Advanced Management" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Training Type</Label>
              <Select value={type} onValueChange={(v: 'INTERNAL' | 'EXTERNAL') => setType(v)}>
                <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="EXTERNAL">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border rounded-lg px-3 h-10 mt-auto bg-muted/20">
              <Label className="text-xs">Mandatory</Label>
              <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              className="w-full text-sm rounded-md border p-2 min-h-20 bg-background"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Learning Objectives</Label>
            <textarea
              className="w-full text-sm rounded-md border p-2 min-h-20 bg-background"
              value={objectives}
              onChange={e => setObjectives(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted/10 px-6 py-4 -mx-6 -mb-6 border-t mt-4">
          <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

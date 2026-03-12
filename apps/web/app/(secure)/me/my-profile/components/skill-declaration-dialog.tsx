'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AsyncSearchSelect } from '@/components/ui/async-search-select';
import { Skill } from '@/types/skills.types';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSuccessAction: () => void;
};

export function SkillDeclarationDialog({ open, onOpenChangeAction, onSuccessAction }: Props) {
  const { toast } = useToast();
  const [skillId, setSkillId] = useState<string | null>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState('BEGINNER');
  const [acquiredDate, setAcquiredDate] = useState(new Date().toISOString().slice(0, 10));
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSkillId(null);
      setProficiencyLevel('BEGINNER');
      setAcquiredDate(new Date().toISOString().slice(0, 10));
      setEvidenceUrl('');
      setNotes('');
    }
  }, [open]);

  const fetchSkills = useCallback(async (s: string) => {
    const res = await apiFetch<any[]>('/skills/taxonomy');
    return res.flatMap(c => c.skills).filter(sk => sk.name.toLowerCase().includes(s.toLowerCase()));
  }, []);

  async function handleSubmit() {
    if (!skillId || !acquiredDate) return;

    try {
      setLoading(true);
      await apiFetch('/skills/my-skills', {
        method: 'POST',
        body: JSON.stringify({
          skillId,
          proficiencyLevel,
          acquiredDate,
          evidenceUrl: evidenceUrl.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      toast({ title: 'Skill declared successfully', variant: 'success' });
      onOpenChangeAction(false);
      onSuccessAction();
    } catch (err) {
      toast({
        title: 'Failed to declare skill',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-md text-foreground">
        <DialogHeader>
          <DialogTitle>Declare a Skill</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Select Skill <span className="text-destructive">*</span></Label>
            <AsyncSearchSelect<Skill>
              placeholder="Search skill taxonomy..."
              value={skillId}
              onChangeAction={setSkillId}
              fetchOptions={fetchSkills}
              getOptionLabel={o => o.name}
              getOptionValue={o => o.id}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Proficiency Level</Label>
              <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date Acquired</Label>
              <Input type="date" value={acquiredDate} onChange={e => setAcquiredDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Evidence Link (URL)</Label>
            <Input 
              value={evidenceUrl} 
              onChange={e => setEvidenceUrl(e.target.value)} 
              placeholder="e.g. LinkedIn certificate or portfolio link"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              className="w-full text-sm rounded-md border p-2 min-h-[60px] bg-background"
              placeholder="Any additional details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted/10 px-6 py-4 -mx-6 -mb-6 border-t mt-4">
          <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !skillId}>
            {loading ? 'Saving…' : 'Declare Skill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

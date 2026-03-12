'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { NumericInput } from '@/components/ui/numeric-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skill } from '@/types/skills.types';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  categoryId: string;
  initialData?: Skill | null;
  onSuccessAction: () => void;
};

export function SkillDialog({ open, onOpenChangeAction, categoryId, initialData, onSuccessAction }: Props) {
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [name, setName] = useState('');
  const [type, setType] = useState('TECHNICAL');
  const [description, setDescription] = useState('');
  const [expiryMonths, setExpiryMonths] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setDescription(initialData.description ?? '');
      setExpiryMonths(initialData.expiryMonths ?? 0);
      setIsActive(initialData.isActive);
    } else {
      setName('');
      setType('TECHNICAL');
      setDescription('');
      setExpiryMonths(0);
      setIsActive(true);
    }
    setTouched(false);
  }, [initialData, open]);

  const isValid = name.trim().length > 0;

  async function handleSubmit() {
    setTouched(true);
    if (!isValid) return;

    try {
      setLoading(true);

      const body = {
        categoryId,
        name: name.trim(),
        type,
        description: description.trim() || null,
        expiryMonths: expiryMonths > 0 ? expiryMonths : null,
        isActive,
      };

      if (isEdit) {
        await apiFetch(`/skills/skills/${initialData!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast({ title: 'Skill updated', variant: 'success' });
      } else {
        await apiFetch('/skills/skills', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast({ title: 'Skill created', variant: 'success' });
      }

      onOpenChangeAction(false);
      onSuccessAction();
    } catch (err) {
      toast({
        title: isEdit ? 'Failed to update skill' : 'Failed to create skill',
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
          <DialogTitle>{isEdit ? 'Edit Skill' : 'New Skill'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="skill-name">
              Skill Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="skill-name"
              placeholder="e.g. React.js"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={touched && !name.trim() ? 'border-destructive' : ''}
            />
            {touched && !name.trim() && (
              <p className="text-xs text-destructive">Skill name is required.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="skill-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
                <SelectItem value="SOFT_SKILL">Soft Skill</SelectItem>
                <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                <SelectItem value="LANGUAGE">Language</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill-expiry">Expiry Period (Months)</Label>
            <div className="flex items-center gap-3">
              <NumericInput
                id="skill-expiry"
                value={expiryMonths}
                onChangeAction={setExpiryMonths}
                min={0}
                placeholder="0 = No expiry"
                className="w-32"
              />
              <span className="text-xs text-muted-foreground">
                Leave at 0 if the skill doesn&apos;t expire.
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill-desc">Description</Label>
            <textarea
              id="skill-desc"
              placeholder="Optional description…"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={2}
              className="resize-none text-sm w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
             <div className="space-y-0.5">
               <Label htmlFor="skill-active" className="text-sm font-medium cursor-pointer">Active Status</Label>
               <p className="text-[10px] text-muted-foreground italic">Inactive skills are hidden from selection.</p>
             </div>
             <Switch id="skill-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChangeAction(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || (touched && !isValid)}>
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

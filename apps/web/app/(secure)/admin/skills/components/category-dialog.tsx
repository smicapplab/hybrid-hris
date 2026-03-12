'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SkillCategory } from '@/types/skills.types';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  initialData?: SkillCategory | null;
  onSuccessAction: () => void;
};

export function CategoryDialog({ open, onOpenChangeAction, initialData, onSuccessAction }: Props) {
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? '');
    } else {
      setName('');
      setDescription('');
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
        name: name.trim(),
        description: description.trim() || null,
      };

      if (isEdit) {
        await apiFetch(`/skills/categories/${initialData!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast({ title: 'Category updated', variant: 'success' });
      } else {
        await apiFetch('/skills/categories', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast({ title: 'Category created', variant: 'success' });
      }

      onOpenChangeAction(false);
      onSuccessAction();
    } catch (err) {
      toast({
        title: isEdit ? 'Failed to update category' : 'Failed to create category',
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
          <DialogTitle>{isEdit ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              placeholder="e.g. Technical Skills"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={touched && !name.trim() ? 'border-destructive' : ''}
            />
            {touched && !name.trim() && (
              <p className="text-xs text-destructive">Name is required.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <textarea
              id="cat-desc"
              placeholder="Optional description…"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
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

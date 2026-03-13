'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  scheduleId: string;
  programTitle: string;
  onSuccessAction: () => void;
};

export function TrainingFeedbackDialog({ open, onOpenChangeAction, scheduleId, programTitle, onSuccessAction }: Props) {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      await apiFetch(`/training/schedules/${scheduleId}/feedback`, {
        method: 'PATCH',
        body: JSON.stringify({ rating: String(rating), comments }),
      });

      toast({ title: 'Feedback submitted successfully', variant: 'success' });
      onSuccessAction();
      onOpenChangeAction(false);
    } catch (err: any) {
      toast({
        title: 'Failed to submit feedback',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-md text-foreground">
        <DialogHeader>
          <DialogTitle>Training Evaluation</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            How was your experience with <strong>{programTitle}</strong>? Your feedback helps us improve.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comments (Optional)</label>
            <Textarea
              placeholder="Tell us what you liked or how we can improve..."
              className="min-h-32 resize-none"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChangeAction(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/ui/numeric-input';
import { Loader2 } from 'lucide-react';

interface UpdateLimitDialogProps {
    open: boolean;
    onClose: () => void;
    orgUnitId: string;
    positionId: string;
    positionTitle: string;
    currentLimit: number;
    onSuccessAction: () => void;
}

export function UpdateLimitDialog({
    open,
    onClose,
    orgUnitId,
    positionId,
    positionTitle,
    currentLimit,
    onSuccessAction,
}: UpdateLimitDialogProps) {
    const { toast } = useToast();
    const [limit, setLimit] = useState(currentLimit);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) setLimit(currentLimit);
    }, [open, currentLimit]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiFetch(`/org-units/${orgUnitId}/positions/${positionId}/limit`, {
                method: 'PATCH',
                body: JSON.stringify({ limit }),
            });

            toast({
                title: 'Limit Updated',
                description: `Headcount limit for ${positionTitle} has been updated.`,
                variant: 'success',
            });
            onSuccessAction();
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update limit',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Headcount Limit</DialogTitle>
                    <DialogDescription>
                        Adjust the authorized strength for <strong>{positionTitle}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="limit">New Headcount Limit</Label>
                        <NumericInput
                            id="limit"
                            mode="int"
                            min={0}
                            value={limit}
                            onChangeAction={(val) => setLimit(val)}
                            required
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Note: This change bypasses the Manpower Request workflow. Use only for corrections or approved restructuring.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

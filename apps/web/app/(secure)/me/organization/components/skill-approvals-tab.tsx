'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, ExternalLink, User, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';

interface PendingSkill {
  id: string;
  employeeId: string;
  employeeFirstName: string;
  employeeLastName: string;
  employeeNo: string;
  skillId: string;
  skillName: string;
  skillType: string;
  proficiencyLevel: string;
  acquiredDate: string;
  evidenceUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export function SkillApprovalsTab() {
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingSkill[]>([]);
  const [loading, setLoading] = useState(true);

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'VERIFIED' | 'REJECTED' | null>(null);
  const [managerNote, setManagerNote] = useState('');

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<PendingSkill[]>('/skills/approvals/pending');
      setPending(result);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
      toast({
        title: 'Failed to load approvals',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function handleProcessApproval() {
    if (!processingId || !actionType) return;

    try {
      await apiFetch(`/skills/approvals/${processingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: actionType,
          notes: managerNote.trim() || undefined
        })
      });

      toast({
        title: actionType === 'VERIFIED' ? 'Skill Verified' : 'Skill Rejected',
        variant: actionType === 'VERIFIED' ? 'success' : 'default'
      });

      setProcessingId(null);
      setActionType(null);
      setManagerNote('');
      loadPending();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    }
  }

  if (loading && pending.length === 0) {
    return <div className="p-12 text-center animate-pulse text-muted-foreground text-sm font-medium">Loading pending approvals…</div>;
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-muted/5 rounded-2xl border border-dashed">
        <CheckCircle2 className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground italic">You&apos;re all caught up! No pending skill approvals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {pending.map((s) => (
          <Card key={s.id} className="overflow-hidden hover:border-primary/30 transition-all shadow-sm bg-card border-border/60">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Employee Info Sidebar */}
                <div className="w-full md:w-60 bg-muted/20 p-5 border-b md:border-b-0 md:border-r border-border/40 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-background border flex items-center justify-center shrink-0">
                      <User className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 text-foreground">
                      <p className="text-sm font-bold truncate leading-tight">{s.employeeFirstName} {s.employeeLastName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">{s.employeeNo}</p>
                    </div>
                  </div>
                  <div className="pt-1 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Submitted</span>
                      <p className="text-xs font-semibold text-foreground">{new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Acquired On</span>
                      <p className="text-xs font-semibold text-foreground">{new Date(s.acquiredDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Skill Details */}
                <div className="flex-1 p-5 space-y-5 text-foreground">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base leading-none">{s.skillName}</h3>
                        <Badge variant="outline" className="text-[9px] uppercase h-4 px-1.5 font-mono">{s.skillType}</Badge>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0 h-5">
                        {s.proficiencyLevel}
                      </Badge>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-destructive border-destructive/20 hover:bg-destructive/5 font-bold text-[11px] uppercase tracking-tight shadow-none"
                        onClick={() => {
                          setProcessingId(s.id);
                          setActionType('REJECTED');
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] uppercase tracking-tight shadow-none"
                        onClick={() => {
                          setProcessingId(s.id);
                          setActionType('VERIFIED');
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Verify
                      </Button>
                    </div>
                  </div>

                  {/* Employee Notes/Evidence */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <MessageSquare className="w-3 h-3" /> Employee Notes
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground italic leading-relaxed min-h-15">
                        {s.notes || "No additional notes provided."}
                      </div>
                    </div>

                    {s.evidenceUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          <ExternalLink className="w-3 h-3" /> Evidence
                        </div>
                        <a
                          href={s.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-3 rounded-xl border bg-blue-50/20 border-blue-100 text-blue-600 hover:bg-blue-50/40 transition-colors text-xs font-bold shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" /> Open Verification Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!processingId}
        onOpenChange={(o) => !o && setProcessingId(null)}
        title={actionType === 'VERIFIED' ? 'Verify Skill Declaration' : 'Reject Skill Declaration'}
        description={actionType === 'VERIFIED'
          ? "Are you sure you want to verify this skill? It will be marked as officially recognized on the employee's profile."
          : "Are you sure you want to reject this declaration? The employee will be notified."
        }
        onConfirm={handleProcessApproval}
        confirmText={actionType === 'VERIFIED' ? "Verify" : "Reject"}
        variant={actionType === 'VERIFIED' ? 'default' : 'destructive'}
      >
        <div className="pt-4 space-y-2">
          <Label htmlFor="manager-note" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add a Note (Optional)</Label>
          <textarea
            id="manager-note"
            className="w-full rounded-md border bg-background p-3 text-sm min-h-25 focus:ring-1 focus:ring-primary outline-none"
            placeholder={actionType === 'VERIFIED' ? "e.g. Great job on the project!" : "Explain why this was rejected..."}
            value={managerNote}
            onChange={(e) => setManagerNote(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

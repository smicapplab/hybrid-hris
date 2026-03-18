'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Mail, Calendar, Briefcase, GraduationCap,
  Clock, ShieldAlert, CheckCircle2, UserPlus, Info, MapPin, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrainingSchedule } from '@/types/training.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PROFICIENCY_LEVEL_OPTIONS } from '@/lib/employee.enum';
import { AsyncSearchSelect } from '@/components/ui/async-search-select';
import { Textarea } from '@/components/ui/textarea';

interface TalentCardData {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string;
    positionTitle: string;
    orgUnitName: string;
    email: string;
  };
  skills: {
    actual: {
      id: string;
      skillId: string;
      skillName: string;
      skillType: string;
      proficiencyLevel: string;
      verificationStatus: string;
    }[];
    required: { skillId: string; skillName: string; requiredLevel: string }[];
  };
  training: {
    enrollments: { id: string; status: string; programId: string; programTitle: string; startAt: string }[];
    missingMandatory: { id: string; title: string }[];
    scheduledMandatory: { id: string; title: string; scheduleId: string; startAt: string }[];
  };
  upcomingLeaves: { id: string; startDate: string; days: string }[];
  schedule: { startTime: string; endTime: string } | null;
}

interface SkillOption {
  id: string;
  label: string;
  category: string;
}

interface TaxonomyCategory {
  id: string;
  name: string;
  skills: { id: string; name: string }[];
}

type Props = {
  employeeId: string;
  onBackAction: () => void;
};

export function EmployeeTalentCard({ employeeId, onBackAction }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<TalentCardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<TalentCardData>(`/skills/talent-card/${employeeId}`);
      setData(res);
    } catch (err) {
      toast({
        title: 'Failed to load talent card',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
      onBackAction();
    } finally {
      setLoading(false);
    }
  }, [employeeId, toast, onBackAction]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) return <div className="p-12 text-center animate-pulse text-foreground text-sm font-medium">Loading talent profile…</div>;

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBackAction} className="text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Talent Profile</h2>
            <p className="text-sm text-muted-foreground">Team Member Performance & Development</p>
          </div>
        </div>
        <DirectSkillAssignmentDialog
          employeeId={employeeId}
          onSuccessAction={loadData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Identity & Pulse */}
        <div className="space-y-6">
          <Card className="shadow-sm border-border/60 overflow-hidden bg-card">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border">
                  {data.employee.firstName[0]}{data.employee.lastName[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg leading-tight text-foreground">{data.employee.firstName} {data.employee.lastName}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-mono mt-1">{data.employee.employeeNo}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{data.employee.positionTitle}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{data.employee.email}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Work Schedule</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {data.schedule ? `${data.schedule.startTime} - ${data.schedule.endTime}` : 'No fixed schedule'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Upcoming Leaves</span>
                  </div>
                  {data.upcomingLeaves.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No approved leaves scheduled.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {data.upcomingLeaves.map((l) => (
                        <div key={l.id} className="text-[11px] flex justify-between bg-muted/30 p-2 rounded-lg border border-border/40 text-foreground">
                          <span className="font-bold">{new Date(l.startDate).toLocaleDateString()}</span>
                          <span className="text-muted-foreground font-medium">{l.days} Days</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center/Right: Skills & Development */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill Matrix */}
          <Card className="shadow-sm border-border/60 bg-card">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Competency Matrix
                </CardTitle>
                <p className="text-[10px] text-muted-foreground italic font-medium tracking-tight">Requirement Baseline: {data.employee.positionTitle}</p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {data.skills.required.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No skills required for this position yet.</p>
                )}
                {data.skills.required.map(req => {
                  const actual = data.skills.actual.find(s => s.skillId === req.skillId);
                  const isMet = actual && actual.verificationStatus === 'VERIFIED';

                  return (
                    <div key={req.skillId} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/5 transition-colors border-border/60">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{req.skillName}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge variant="outline" className="text-[9px] h-4 font-bold">Target: {req.requiredLevel}</Badge>
                          {actual ? (
                            <Badge variant={isMet ? 'default' : 'secondary'} className="text-[9px] h-4 font-bold shadow-none">
                              Actual: {actual.proficiencyLevel}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[9px] h-4 font-bold shadow-none">Missing</Badge>
                          )}
                        </div>
                      </div>
                      {isMet ? (
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                          <ShieldAlert className="w-4.5 h-4.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ADDITIONAL SKILLS (Verified but not in baseline) */}
                {(() => {
                  const additional = data.skills.actual.filter(s =>
                    s.verificationStatus === 'VERIFIED' &&
                    !data.skills.required.some(r => r.skillId === s.skillId)
                  );
                  if (additional.length === 0) return null;
                  return (
                    <div className="pt-4 space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" /> Additional Verified Skills
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {additional.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-dashed bg-muted/5">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground">{s.skillName}</p>
                              <Badge variant="secondary" className="text-[9px] h-4 font-bold mt-1 shadow-none">
                                {s.proficiencyLevel}
                              </Badge>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* PENDING SKILLS (Needs Manager Action) */}
                {(() => {
                  const pending = data.skills.actual.filter(s => s.verificationStatus === 'PENDING');
                  if (pending.length === 0) return null;
                  return (
                    <div className="pt-4 space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Verification
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {pending.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50/20">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground">{s.skillName}</p>
                              <Badge variant="outline" className="text-[9px] h-4 font-bold mt-1 border-orange-200 text-orange-700">
                                Self-Declared: {s.proficiencyLevel}
                              </Badge>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200 animate-pulse">
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Training Roadmap */}
          <Card className="shadow-sm border-border/60 bg-card">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-orange-500" />
                Training & Compliance Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Missing Mandatory */}
              <div className="space-y-3 text-foreground">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-2 mb-4 leading-none">
                  <ShieldAlert className="w-3.5 h-3.5" /> Missing Mandatory Items
                </h4>
                {data.training.missingMandatory.length === 0 ? (
                  <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-xl border border-green-100 text-xs font-bold">
                    <CheckCircle2 className="w-5 h-5 text-green-600" /> Fully Compliant with Mandatory Training
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {data.training.missingMandatory.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50/20 group text-foreground">
                        <span className="text-sm font-bold truncate pr-4">{m.title}</span>
                        <EnrollButton programId={m.id} employeeId={employeeId} onSuccessAction={loadData} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduled Mandatory */}
              {data.training.scheduledMandatory.length > 0 && (
                <div className="space-y-3 text-foreground pt-4 border-t border-dashed">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2 mb-4 leading-none">
                    <Clock className="w-3.5 h-3.5" /> Scheduled Mandatory Items
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {data.training.scheduledMandatory.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-amber-100 bg-amber-50/10 group text-foreground">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-bold truncate pr-4">{m.title}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">Starts {new Date(m.startAt).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold border-amber-200 text-amber-700 bg-amber-50 shadow-none shrink-0">
                          Enrolled
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Enrollments */}
              <div className="space-y-3 pt-4 border-t border-dashed text-foreground">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4 leading-none">
                  <Info className="w-3.5 h-3.5" /> Training Activity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-foreground">
                  {data.training.enrollments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-1">No training records found.</p>
                  ) : (
                    data.training.enrollments.slice(0, 6).map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/5 text-foreground hover:bg-muted/10 transition-colors">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-bold truncate text-[13px] leading-tight">{e.programTitle}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{new Date(e.startAt).toLocaleDateString()}</span>
                        </div>
                        <Badge variant={e.status === 'COMPLETED' ? 'default' : 'outline'} className="text-[9px] uppercase font-bold shadow-none shrink-0 ml-3">
                          {e.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DirectSkillAssignmentDialog({ employeeId, onSuccessAction }: { employeeId: string; onSuccessAction: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [skillId, setSkillId] = useState<string | null>(null);
  const [level, setLevel] = useState<string>('BEGINNER');
  const [notes, setNotes] = useState('');

  const fetchSkills = async (s: string): Promise<SkillOption[]> => {
    const res = await apiFetch<TaxonomyCategory[]>(`/skills/taxonomy`);
    const list: SkillOption[] = [];
    res.forEach(cat => {
      cat.skills.forEach((sk) => {
        if (sk.name.toLowerCase().includes(s.toLowerCase())) {
          list.push({ id: sk.id, label: sk.name, category: cat.name });
        }
      });
    });
    return list;
  };

  const handleAssign = async () => {
    if (!skillId) return;
    try {
      setSaving(true);
      await apiFetch('/skills/assign', {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
          skillId,
          proficiencyLevel: level,
          notes
        })
      });
      toast({ title: 'Skill assigned successfully', variant: 'success' });
      setOpen(false);
      setSkillId(null);
      setNotes('');
      onSuccessAction();
    } catch (err) {
      toast({
        title: 'Assignment failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 font-bold uppercase text-[10px]">
          <Plus className="w-3.5 h-3.5" /> Assign Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25 text-foreground">
        <DialogHeader>
          <DialogTitle>Assign Verified Skill</DialogTitle>
          <DialogDescription>
            Directly assign and verify a skill for this team member. This action does not require further approval.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Select Skill</Label>
            <AsyncSearchSelect
              placeholder="Search skill catalog..."
              value={skillId}
              onChangeAction={setSkillId}
              fetchOptions={fetchSkills}
              getOptionLabel={(o) => o.label}
              getOptionValue={(o) => o.id}
            />
          </div>
          <div className="space-y-2">
            <Label>Proficiency Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_LEVEL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Manager Notes (Optional)</Label>
            <Textarea
              placeholder="Reason for assignment or evidence noted..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!skillId || saving}>
            {saving ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnrollButton({ programId, employeeId, onSuccessAction }: { programId: string; employeeId: string; onSuccessAction: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [open, setOpen] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<TrainingSchedule[]>(`/training/programs/${programId}/schedules`);
      setSchedules(res.filter(s => s.status === 'SCHEDULED'));
    } catch (err) {
      toast({
        title: 'Failed to fetch schedules',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (scheduleId: string) => {
    try {
      await apiFetch(`/training/schedules/${scheduleId}/attendees`, {
        method: 'POST',
        body: JSON.stringify({ employeeId })
      });
      toast({ title: 'Employee enrolled successfully', variant: 'success' });
      setOpen(false);
      onSuccessAction();
    } catch (err) {
      toast({
        title: 'Enrollment failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) fetchSchedules(); }}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold gap-1 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 shadow-none transition-colors">
          <UserPlus className="w-3 h-3" /> Enroll
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 text-foreground shadow-xl border-border/60" align="end">
        <div className="space-y-4 text-foreground">
          <div className="space-y-1">
            <h4 className="text-sm font-bold leading-none">Upcoming Sessions</h4>
            <p className="text-[10px] text-muted-foreground">Select a schedule to enroll this employee.</p>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-10 w-full bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-6 text-center rounded-lg border border-dashed bg-muted/10">
              <p className="text-xs text-muted-foreground italic">No upcoming sessions found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
              {schedules.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 hover:border-primary/30 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-foreground">{new Date(s.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" /> {s.location || 'Remote'}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-3 text-[10px] font-bold uppercase text-primary hover:bg-primary/10" onClick={() => handleEnroll(s.id)}>Select</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

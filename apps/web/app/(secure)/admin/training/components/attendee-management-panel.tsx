'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus, Trash2, CheckCircle2, XCircle, MoreVertical, Search, Users, Building2, Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AsyncSearchSelect } from '@/components/ui/async-search-select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee.type';
import { Checkbox } from '@/components/ui/checkbox';
import { OrgUnitOption } from '@/types/org-unit.type';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Attendee {
  enrollmentId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeNo: string;
  orgUnitName: string | null;
  status: string;
  processedAt: string | null;
}

interface EmployeeSearchOption {
  id: string;
  label: string;
}

type Props = {
  scheduleId: string;
  programTitle: string;
  onBackAction: () => void;
};

export function AttendeeManagementPanel({ scheduleId, programTitle, onBackAction }: Props) {
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState<string | null>(null);
  const [newOrgUnitId, setNewOrgUnitId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [enrollingEligible, setEnrollingEligible] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm states
  const [attendeeToRemove, setAttendeeToRemove] = useState<string | null>(null);
  const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);
  const [showAutoEnrollConfirm, setShowAutoEnrollConfirm] = useState(false);

  const loadAttendees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Attendee[]>(`/training/schedules/${scheduleId}/attendees`);
      setAttendees(data);
      setSelectedIds(new Set()); // Reset selection on reload
    } catch (err) {
      toast({
        title: 'Failed to load attendees',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [scheduleId, toast]);

  const fetchEmployees = useCallback(async (s: string) => {
    const res = await apiFetch<{ data: Employee[] }>(`/employees?search=${encodeURIComponent(s)}`);
    return res.data.map(e => ({ id: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeNo})` }));
  }, []);

  const fetchOrgUnits = useCallback(async (s: string) => {
    const res = await apiFetch<OrgUnitOption[]>(`/org-units?search=${encodeURIComponent(s)}`);
    return res;
  }, []);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  // Bulk handlers
  async function handleBulkStatus(status: string) {
    if (selectedIds.size === 0) return;
    try {
      setActionLoading(true);
      await apiFetch(`/training/enrollments/bulk-status`, {
        method: 'PATCH',
        body: JSON.stringify({ enrollmentIds: Array.from(selectedIds), status })
      });
      toast({ title: `Successfully updated ${selectedIds.size} attendees`, variant: 'success' });
      loadAttendees();
    } catch (err) {
      toast({
        title: 'Bulk update failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAutoEnroll() {
    try {
      setEnrollingEligible(true);
      const res = await apiFetch<{ count: number }>(`/training/schedules/${scheduleId}/enroll-eligible`, {
        method: 'POST'
      });
      toast({ 
        title: 'Auto-enrollment complete', 
        description: `Enrolled ${res.count} eligible staff who haven't completed this training.`,
        variant: 'success' 
      });
      loadAttendees();
    } catch (err) {
      toast({
        title: 'Auto-enrollment failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setEnrollingEligible(false);
    }
  }

  async function handleConfirmBulkRemove() {
    if (selectedIds.size === 0) return;
    try {
      setActionLoading(true);
      await apiFetch(`/training/enrollments/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ enrollmentIds: Array.from(selectedIds) })
      });
      toast({ title: `Successfully removed ${selectedIds.size} attendees`, variant: 'success' });
      setShowBulkRemoveConfirm(false);
      loadAttendees();
    } catch (err) {
      toast({
        title: 'Bulk removal failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Individual handlers
  async function handleAddAttendee() {
    if (!newEmployeeId) return;
    try {
      await apiFetch(`/training/schedules/${scheduleId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ employeeIds: [newEmployeeId] })
      });
      toast({ title: 'Attendee added', variant: 'success' });
      setNewEmployeeId(null);
      loadAttendees();
    } catch (err) {
      toast({ 
        title: 'Failed to add attendee', 
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive' 
      });
    }
  }

  async function handleEnrollOrg() {
    if (!newOrgUnitId) return;
    try {
      setActionLoading(true);
      const res = await apiFetch<{ count: number }>(`/training/schedules/${scheduleId}/enroll-org`, {
        method: 'POST',
        body: JSON.stringify({ orgUnitId: newOrgUnitId })
      });
      toast({ title: `Successfully enrolled ${res.count} employees`, variant: 'success' });
      setNewOrgUnitId(null);
      loadAttendees();
    } catch (err) {
      toast({
        title: 'Org-wide enrollment failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateStatus(enrollmentId: string, status: string) {
    try {
      await apiFetch(`/training/enrollments/${enrollmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      toast({ title: `Status updated to ${status}`, variant: 'success' });
      loadAttendees();
    } catch (err) {
      toast({
        title: 'Failed to update status',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  }

  async function handleConfirmRemove() {
    if (!attendeeToRemove) return;
    try {
      await apiFetch(`/training/enrollments/${attendeeToRemove}`, { method: 'DELETE' });
      toast({ title: 'Attendee removed', variant: 'success' });
      setAttendeeToRemove(null);
      loadAttendees();
    } catch (err) {
      toast({
        title: 'Failed to remove attendee',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  }

  const filtered = useMemo(() => attendees.filter(a =>
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    a.employeeNo.toLowerCase().includes(search.toLowerCase())
  ), [attendees, search]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map(a => a.enrollmentId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBackAction}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Attendee Management</h2>
            <p className="text-sm text-muted-foreground">{programTitle}</p>
          </div>
        </div>

        <Button 
            variant="outline" 
            className="gap-2 font-bold uppercase text-[10px] h-9 border-primary/20 text-primary hover:bg-primary/5 shadow-none" 
            disabled={enrollingEligible}
            onClick={() => setShowAutoEnrollConfirm(true)}
        >
            {enrollingEligible ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
            Sync Non-Compliant
        </Button>

        <ConfirmDialog
            open={showAutoEnrollConfirm}
            onOpenChange={setShowAutoEnrollConfirm}
            title="Auto-Enroll Non-Compliant Staff"
            description="This will identify all employees who are required to take this training (based on Global, Position, or Org rules) and haven't completed it yet, then enroll them into this schedule."
            onConfirm={handleAutoEnroll}
            confirmText={enrollingEligible ? 'Syncing...' : 'Start Sync'}
            loading={enrollingEligible}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Attendee List */}
        <div className="lg:col-span-2 space-y-4">
          {/* List Toolbar */}
          <div className="flex items-center justify-between gap-4 bg-muted/20 p-2 rounded-xl border text-foreground">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-9 text-xs bg-background"
                placeholder="Filter attendees..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary mr-2">
                  {selectedIds.size} Selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 gap-2 text-[10px] uppercase font-bold" disabled={actionLoading}>
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 text-foreground">
                    <DropdownMenuItem onClick={() => handleBulkStatus('COMPLETED')} className="text-green-600 gap-2 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatus('DID_NOT_ATTEND')} className="text-orange-600 gap-2 font-medium">
                      <XCircle className="w-3.5 h-3.5" /> Mark No-Show
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBulkRemoveConfirm(true)} className="text-destructive gap-2 font-medium">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                {attendees.length} Total Enrolled
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/30 text-foreground">
                <TableRow>
                  <TableHead className="w-10 h-10 px-4">
                    <Checkbox
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onCheckedChange={(v) => toggleSelectAll(!!v)}
                    />
                  </TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase">Employee</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase text-center">Status</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase text-right px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-foreground">
                {loading && attendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                      Loading attendee list...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-xs text-muted-foreground italic">
                      No attendees found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.enrollmentId} className={cn("group transition-colors", selectedIds.has(a.enrollmentId) && "bg-primary/5")}>
                      <TableCell className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(a.enrollmentId)}
                          onCheckedChange={(v) => toggleSelect(a.enrollmentId, !!v)}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{a.firstName} {a.lastName}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">{a.employeeNo} • {a.orgUnitName || 'No Dept'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge variant={
                          a.status === 'COMPLETED' ? 'default' :
                            a.status === 'CANCELLED' || a.status === 'DID_NOT_ATTEND' ? 'destructive' :
                              'outline'
                        } className="text-[9px] uppercase font-bold h-4.5">
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-foreground">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(a.enrollmentId, 'COMPLETED')} className="text-green-600 gap-2 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(a.enrollmentId, 'DID_NOT_ATTEND')} className="text-orange-600 gap-2 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Mark No-Show
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAttendeeToRemove(a.enrollmentId)} className="text-destructive gap-2 font-medium">
                              <Trash2 className="w-3.5 h-3.5" /> Remove from List
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Column: Enrollment Tools */}
        <div className="space-y-6">
          {/* Individual Enrollment */}
          <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <UserPlus className="w-4 h-4" />
              <h3 className="text-xs uppercase tracking-widest text-foreground">Enroll Student</h3>
            </div>
            <AsyncSearchSelect<EmployeeSearchOption>
              placeholder="Search employee..."
              value={newEmployeeId}
              onChangeAction={setNewEmployeeId}
              fetchOptions={fetchEmployees}
              getOptionLabel={o => o.label}
              getOptionValue={o => o.id}
            />
            <Button className="w-full gap-2 font-bold text-xs uppercase shadow-none" disabled={!newEmployeeId || actionLoading} onClick={handleAddAttendee}>
              <UserPlus className="w-4 h-4" /> Enroll Employee
            </Button>
          </div>

          {/* Org-wide Enrollment */}
          <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4 text-foreground">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <Building2 className="w-4 h-4" />
              <h3 className="text-xs uppercase tracking-widest text-foreground">Org-wide Enrollment</h3>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed italic bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
              Enrolls <strong>all active employees</strong> within the selected unit and its recursive sub-units.
            </p>
            <AsyncSearchSelect<OrgUnitOption>
              placeholder="Search Org Unit..."
              value={newOrgUnitId}
              onChangeAction={setNewOrgUnitId}
              fetchOptions={fetchOrgUnits}
              getOptionLabel={o => o.name}
              getOptionValue={o => o.id}
            />
            <Button variant="outline" className="w-full gap-2 font-bold text-xs uppercase border-blue-200 text-blue-700 hover:bg-blue-50 shadow-none" disabled={!newOrgUnitId || actionLoading} onClick={handleEnrollOrg}>
              <Users className="w-4 h-4" /> Enroll Entire Unit
            </Button>
          </div>

          <div className="p-5 rounded-2xl border bg-muted/20 border-dashed space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground font-bold">
              <Users className="w-4 h-4" />
              <h3 className="text-xs uppercase tracking-widest text-foreground">Admin Tip</h3>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Marking an attendee as <strong className="text-foreground">COMPLETED</strong> will automatically grant them the skills associated with this training program.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!attendeeToRemove}
        onOpenChange={(o) => !o && setAttendeeToRemove(null)}
        title="Remove Attendee"
        description="Are you sure you want to remove this employee from the training? This will also revoke any skills granted by this session."
        onConfirm={handleConfirmRemove}
        variant="destructive"
        confirmText="Remove"
      />

      <ConfirmDialog
        open={showBulkRemoveConfirm}
        onOpenChange={setShowBulkRemoveConfirm}
        title="Remove Multiple Attendees"
        description={`Are you sure you want to remove ${selectedIds.size} employees from this training? All associated skills for these attendees will also be revoked.`}
        onConfirm={handleConfirmBulkRemove}
        variant="destructive"
        confirmText="Remove All Selected"
      />
    </div>
  );
}

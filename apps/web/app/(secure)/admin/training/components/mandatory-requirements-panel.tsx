'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Trash2, Plus, Building2, Briefcase, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AsyncSearchSelect } from '@/components/ui/async-search-select';

interface ProgramOption {
  id: string;
  title: string;
}

interface PositionOption {
  id: string;
  title: string;
}

interface OrgUnitOption {
  id: string;
  name: string;
}

interface MandatoryItem {
  id: string;
  programId: string;
  title: string;
}

export function MandatoryRequirementsPanel() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('position');

  const [targetId, setTargetId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<MandatoryItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPositions = useCallback(async (search: string) => {
    const res = await apiFetch<PositionOption[]>(`/positions?search=${search}&pageSize=100`);
    return res;
  }, []);

  const fetchOrgUnits = useCallback(async (search: string) => {
    const res = await apiFetch<OrgUnitOption[]>(`/org-units?search=${search}&pageSize=100`);
    return res;
  }, []);

  const fetchPrograms = useCallback(async (search: string) => {
    const res = await apiFetch<ProgramOption[]>(`/training/programs?search=${search}`);
    return res;
  }, []);

  const loadRequirements = useCallback(async () => {
    if (!targetId) {
      setRequirements([]);
      return;
    }
    try {
      setLoading(true);
      const endpoint = activeSubTab === 'position'
        ? `/training/mandatory/positions/${targetId}`
        : `/training/mandatory/org-units/${targetId}`;
      const res = await apiFetch<MandatoryItem[]>(endpoint);
      setRequirements(res);
    } catch (err) {
      toast({
        title: 'Failed to load requirements',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, activeSubTab, toast, refreshKey]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  const handleAddRequirement = async () => {
    if (!targetId || !programId) return;
    try {
      const endpoint = activeSubTab === 'position'
        ? `/training/mandatory/positions`
        : `/training/mandatory/org-units`;
      const body = { targetId, programId };

      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      toast({ title: 'Requirement added successfully', variant: 'success' });
      setProgramId(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast({
        title: 'Failed to add requirement',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveRequirement = async (pid: string) => {
    if (!targetId) return;
    try {
      const endpoint = activeSubTab === 'position'
        ? `/training/mandatory/positions/${targetId}/${pid}`
        : `/training/mandatory/org-units/${targetId}/${pid}`;

      await apiFetch(endpoint, { method: 'DELETE' });
      toast({ title: 'Requirement removed', variant: 'success' });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast({
        title: 'Failed to remove requirement',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-foreground">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" /> Mandatory Training Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Define which training programs are required for specific positions or departments.
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={(v) => { setActiveSubTab(v); setTargetId(null); setRequirements([]); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-80 h-10 p-1 bg-muted/50 rounded-lg border">
          <TabsTrigger value="position" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
            <Briefcase className="w-3.5 h-3.5" /> By Position
          </TabsTrigger>
          <TabsTrigger value="org-unit" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground">
            <Building2 className="w-3.5 h-3.5" /> By Department
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Select {activeSubTab === 'position' ? 'Position' : 'Department'}
                  </label>
                  {activeSubTab === 'position' ? (
                    <AsyncSearchSelect<PositionOption>
                      placeholder="Search position..."
                      value={targetId}
                      onChangeAction={setTargetId}
                      fetchOptions={fetchPositions}
                      getOptionLabel={o => o.title}
                      getOptionValue={o => o.id}
                    />
                  ) : (
                    <AsyncSearchSelect<OrgUnitOption>
                      placeholder="Search department..."
                      value={targetId}
                      onChangeAction={setTargetId}
                      fetchOptions={fetchOrgUnits}
                      getOptionLabel={o => o.name}
                      getOptionValue={o => o.id}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Add Mandatory Program
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AsyncSearchSelect<ProgramOption>
                        placeholder="Search training program..."
                        value={programId}
                        onChangeAction={setProgramId}
                        fetchOptions={fetchPrograms}
                        getOptionLabel={o => o.title}
                        getOptionValue={o => o.id}
                        excludeIds={requirements.map(r => r.programId)}
                        disabled={!targetId}
                      />
                    </div>
                    <Button
                      onClick={handleAddRequirement}
                      disabled={!targetId || !programId}
                      className="shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>

              {!targetId && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 border border-dashed rounded-xl bg-muted/5">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium italic">
                    Select a {activeSubTab === 'position' ? 'position' : 'department'} to view and manage its requirements.
                  </p>
                </div>
              )}

              {targetId && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      Current Requirements ({requirements.length})
                    </h3>
                  </div>

                  {loading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                    </div>
                  ) : requirements.length === 0 ? (
                    <div className="py-8 text-center border border-dashed rounded-xl bg-muted/5">
                      <p className="text-xs text-muted-foreground italic">No mandatory training programs defined yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {requirements.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 group">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{r.title}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-medium mt-0.5 tracking-tight">Requirement Active</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveRequirement(r.programId)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { ShieldCheck, ShieldAlert, UserCheck, ChevronDown, Loader2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComplianceReport {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string;
  requiredCount: number;
  completedCount: number;
  missingMandatory: { id: string; title: string }[];
  scheduledMandatory: { id: string; title: string; scheduleId: string; startAt: string }[];
  isCompliant: boolean;
}

interface PaginatedResponse {
    data: ComplianceReport[];
    total: number;
    hasMore: boolean;
}

type Props = {
  onSelectEmployeeAction: (id: string) => void;
  recursive: boolean;
  search: string;
};

const LIMIT = 20;

export function TeamComplianceTab({ onSelectEmployeeAction, recursive, search }: Props) {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadCompliance = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        recursive: String(recursive),
        search: search,
        offset: String(currentOffset),
        limit: String(LIMIT)
      });

      const res = await apiFetch<PaginatedResponse>(`/training/team-compliance?${params.toString()}`);
      
      setTotal(res.total);
      setHasMore(res.hasMore);
      
      if (append) {
        setReports(prev => [...prev, ...res.data]);
      } else {
        setReports(res.data);
      }
    } catch (err) {
      console.error('Failed to load compliance report', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [recursive, search]);

  useEffect(() => {
    setOffset(0);
    loadCompliance(0, false);
  }, [loadCompliance]);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    loadCompliance(nextOffset, true);
  };

  if (loading && offset === 0) return <div className="p-12 text-center animate-pulse text-sm text-foreground font-medium">Calculating team compliance…</div>;

  if (reports.length === 0 && !loading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-muted/5 rounded-2xl border border-dashed text-foreground">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground italic text-center">No matching team members found.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-foreground pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Summary */}
        <Card className="bg-blue-50/20 border-blue-100 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">Team Compliance</p>
              <p className="text-xl font-black">
                {reports.length > 0 ? Math.round((reports.filter(r => r.isCompliant).length / reports.length) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="md:col-span-2 flex items-center justify-end px-2">
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{total} total members monitored</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-[10px] uppercase font-bold text-foreground h-12">Employee</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-foreground">Status</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-center text-foreground">Progress</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-foreground">Missing Mandatory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow 
                key={r.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => onSelectEmployeeAction(r.id)}
              >
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold group-hover:text-primary transition-colors">{r.firstName} {r.lastName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">{r.employeeNo}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {r.isCompliant ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1 shadow-none font-bold uppercase text-[9px]">
                      <ShieldCheck className="w-3 h-3" /> Compliant
                    </Badge>
                  ) : r.missingMandatory.length === 0 ? (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1 shadow-none font-bold uppercase text-[9px]">
                      <Clock className="w-3 h-3" /> Scheduled
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 shadow-none font-bold uppercase text-[9px]">
                      <ShieldAlert className="w-3 h-3" /> Non-Compliant
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="w-40">
                  <div className="space-y-1.5 mx-auto max-w-30">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>{r.completedCount}/{r.requiredCount}</span>
                      <span>{r.requiredCount > 0 ? Math.round((r.completedCount / r.requiredCount) * 100) : 100}%</span>
                    </div>
                    <Progress value={r.requiredCount > 0 ? (r.completedCount / r.requiredCount) * 100 : 100} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.missingMandatory.length === 0 && r.scheduledMandatory.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic font-medium opacity-50">None</span>
                    ) : (
                      <>
                        {r.missingMandatory.map(m => (
                          <Badge key={m.id} variant="outline" className="text-[9px] bg-red-50/50 text-red-600 border-red-100 uppercase font-bold shadow-none">
                            {m.title}
                          </Badge>
                        ))}
                        {r.scheduledMandatory.map(m => (
                          <Badge key={m.id} variant="outline" className="text-[9px] bg-amber-50/50 text-amber-600 border-amber-100 uppercase font-bold shadow-none">
                            {m.title}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-4">
            <button 
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                onClick={handleLoadMore}
                disabled={loadingMore}
            >
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Show More ({total - reports.length} remaining)
            </button>
        </div>
      )}
    </div>
  );
}

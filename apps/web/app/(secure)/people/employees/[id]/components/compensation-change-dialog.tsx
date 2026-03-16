'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Info } from 'lucide-react'
import { EmployeeCompensation } from '@/types/attendance.types'

interface TemplateComponent {
    payrollComponentId: string;
    amount: string;
    name: string;
    code: string;
}

interface CompensationChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    oldRankName: string;
    newRankName: string;
    currentCompensations: EmployeeCompensation[];
    newTemplateComponents: TemplateComponent[];
    loading?: boolean;
}

export function CompensationChangeDialog({
    open,
    onOpenChange,
    onConfirm,
    oldRankName,
    newRankName,
    currentCompensations,
    newTemplateComponents,
    loading,
}: CompensationChangeDialogProps) {
    // Combine to show a diff
    const allCodes = Array.from(new Set([
        ...currentCompensations.map(c => c.component.code),
        ...newTemplateComponents.map(c => c.code)
    ]));

    const formatAmount = (amt: string | undefined) => {
        if (amt === undefined) return '-';
        return `₱${Number(amt).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-600" />
                        Confirm Rank & Compensation Change
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Updating the employee's rank will automatically synchronize their compensation to the new rank's template.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Rank</span>
                            <span className="font-semibold text-slate-700">{oldRankName}</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking_widest leading-none mb-1 text-right">New Rank</span>
                            <span className="font-bold text-indigo-700">{newRankName}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="text-[10px] font-bold uppercase py-2">Component</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase py-2 text-right">From</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase py-2 text-right">To</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allCodes.map(code => {
                                    const current = currentCompensations.find(c => c.component.code === code);
                                    const next = newTemplateComponents.find(c => c.code === code);
                                    const isChanged = current?.amount !== next?.amount;

                                    return (
                                        <TableRow key={code}>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold">{next?.name || current?.component.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2 text-xs font-mono text-slate-500">
                                                {formatAmount(current?.amount)}
                                            </TableCell>
                                            <TableCell className={`text-right py-2 text-xs font-mono font-bold ${isChanged ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-700'}`}>
                                                {formatAmount(next?.amount)}
                                                {isChanged && !current && <Badge className="ml-2 scale-75 origin-right bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[8px]">New</Badge>}
                                                {isChanged && !next && <Badge className="ml-2 scale-75 origin-right bg-red-50 text-red-700 border-red-100 uppercase text-[8px]">Removed</Badge>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                    >
                        {loading ? 'Processing...' : 'Confirm & Save'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

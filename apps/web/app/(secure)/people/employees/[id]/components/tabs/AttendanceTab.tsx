'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar as CalendarIcon, ShieldCheck, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Employee } from '@/types/employee.type'
import type { ShiftAssignment, AttendanceLog, PendingChangeItem } from '@/types/attendance.types'
import { DateRangePickerField } from '@/components/ui/date-range-picker-field'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { SectionHeading } from '../../../helpers'

interface AttendanceTabProps {
    employee: Employee;
    pendingShifts: PendingChangeItem[];
    attendanceLogs: AttendanceLog[];
    attendanceRange: { from: string, to: string };
    onRangeChange: (range: { from: string, to: string }) => void;
    attendancePage: number;
    onPageChange: (page: number) => void;
    attendanceTotal: number;
    attendanceLoading: boolean;
    getShiftDays: (s: ShiftAssignment | PendingChangeItem) => string;
    handleCancelPendingShift: (id: string) => void;
    setIsChangeScheduleOpen: (isOpen: boolean) => void;
}

export function AttendanceTab({
    employee,
    pendingShifts,
    attendanceLogs,
    attendanceRange,
    onRangeChange,
    attendancePage,
    onPageChange,
    attendanceTotal,
    attendanceLoading,
    getShiftDays,
    handleCancelPendingShift,
    setIsChangeScheduleOpen,
}: AttendanceTabProps) {
    const totalPages = Math.ceil(attendanceTotal / 30)
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-muted/60">
                <CardContent className="pt-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <SectionHeading>Active Shift Schedule</SectionHeading>
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-semibold">
                            Active
                        </Badge>
                    </div>

                    {employee.shiftAssignment ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Working Hours</p>
                                        <p className="text-base font-bold tracking-tight">
                                            {employee.shiftAssignment.startTime} — {employee.shiftAssignment.endTime}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {employee.shiftAssignment.breakMinutes}m break · {employee.shiftAssignment.gracePeriodMinutes || 0}m grace · {employee.shiftAssignment.isFlexible ? 'Flexible' : 'Fixed'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <CalendarIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Schedule Days</p>
                                        <p className="text-base font-bold tracking-tight">
                                            {getShiftDays(employee.shiftAssignment)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Effective from {format(new Date(employee.shiftAssignment.effectiveFrom), 'PP')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" size="sm" className="font-bold" onClick={() => setIsChangeScheduleOpen(true)}>
                                    Change Schedule
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed rounded-2xl">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="max-w-75 space-y-1">
                                <p className="font-bold">No active shift assigned</p>
                                <p className="text-xs text-muted-foreground">
                                    This employee doesn&apos;t have a regular shift schedule yet.
                                    Assign one to enable automated attendance tracking.
                                </p>
                            </div>
                            <Button size="sm" className="font-bold" onClick={() => setIsChangeScheduleOpen(true)}>
                                Assign Initial Shift
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm border-muted/60 bg-muted/20">
                <CardContent className="pt-8 space-y-6">
                    <SectionHeading>Upcoming Changes</SectionHeading>
                    <div className="space-y-4">
                        {pendingShifts.length > 0 ? (
                            pendingShifts.map(shift => (
                                <div key={shift.id} className="p-4 bg-background rounded-xl border border-primary/20 shadow-xs space-y-3 relative group">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 text-[10px] font-bold">
                                            PENDING
                                        </Badge>
                                        <button
                                            onClick={() => handleCancelPendingShift(shift.id)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                            title="Cancel change"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold">{shift.startTime} — {shift.endTime}</p>
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            Effective {format(new Date(shift.effectiveDate), 'PP')}
                                        </p>
                                    </div>
                                    <div className="pt-1 text-[10px] font-bold text-primary uppercase tracking-tighter">
                                        {getShiftDays(shift)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 bg-background rounded-xl border border-muted/60 flex flex-col items-center justify-center text-center py-8 space-y-2">
                                <ShieldCheck className="w-8 h-8 text-muted-foreground/30" />
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Pending Changes</p>
                            </div>
                        )}
                        <div className="pt-4 space-y-3">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Quick Links</p>
                            <Button variant="ghost" className="w-full justify-start text-xs font-medium h-9 rounded-lg">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                View Leave Calendar
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-xs font-medium h-9 rounded-lg">
                                <Clock className="w-4 h-4 mr-2" />
                                Recent Attendance Logs
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-3">
                <Card className="shadow-sm border-muted/60 overflow-hidden">
                    <div className="bg-muted/30 px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Attendance & Schedule History</h3>
                            <p className="text-[10px] text-muted-foreground">Detailed logs of work dates, shift schedules, and actual timings.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="w-full sm:w-64">
                                <DateRangePickerField
                                    label=""
                                    startDate={attendanceRange.from}
                                    endDate={attendanceRange.to}
                                    onChangeAction={(start, end) => onRangeChange({ from: start, to: end })}
                                    placeholder="Filter by date range"
                                />
                            </div>
                            <Badge variant="secondary" className="font-semibold text-[10px] whitespace-nowrap">
                                {attendanceTotal} RECORDS FOUND
                            </Badge>
                        </div>
                    </div>
                    <CardContent className="p-0 relative">
                        {attendanceLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Refreshing logs...</span>
                                </div>
                            </div>
                        )}
                        {attendanceLogs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/10">
                                            <TableHead className="font-bold text-xs uppercase pl-6">Work Date</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Schedule Snapshot</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Actual Log In</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Actual Log Out</TableHead>
                                            <TableHead className="font-bold text-xs uppercase text-center">Hours</TableHead>
                                            <TableHead className="font-bold text-xs uppercase pr-6 text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceLogs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-muted/5 transition-colors group">
                                                <TableCell className="font-bold text-sm text-slate-700 pl-6">
                                                    {format(new Date(log.workDate), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell className="text-[11px] font-medium text-muted-foreground">
                                                    {log.startTime && log.endTime ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                            {log.startTime} - {log.endTime}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">NO SCHEDULE</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {log.actualInAt ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-700">{format(new Date(log.actualInAt), 'hh:mm a')}</span>
                                                            {log.pendingActualInAt && log.pendingStatus === 'PENDING' && (
                                                                <span className="text-[9px] text-amber-600 font-bold uppercase ring-1 ring-amber-200 bg-amber-50 px-1 rounded-sm w-fit mt-0.5">
                                                                    ADJ: {format(new Date(log.pendingActualInAt), 'hh:mm a')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">MISSING</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {log.actualOutAt ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-700">{format(new Date(log.actualOutAt), 'hh:mm a')}</span>
                                                            {log.pendingActualOutAt && log.pendingStatus === 'PENDING' && (
                                                                <span className="text-[9px] text-amber-600 font-bold uppercase ring-1 ring-amber-200 bg-amber-50 px-1 rounded-sm w-fit mt-0.5">
                                                                    ADJ: {format(new Date(log.pendingActualOutAt), 'hh:mm a')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : log.actualInAt ? (
                                                        <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-200 bg-amber-50">OPEN</Badge>
                                                    ) : (
                                                        <span className="text-slate-400">MISSING</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-center font-bold text-slate-600">
                                                    {log.totalHours || '0.00'}h
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <div className="p-4 bg-muted/30 rounded-full mb-4">
                                    <Clock className="w-8 h-8 opacity-20" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest opacity-80">No logs for this range</p>
                                <p className="text-xs opacity-60">Try adjusting the date range filters above.</p>
                            </div>
                        )}
                        
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Page {attendancePage} of {totalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => onPageChange(Math.max(1, attendancePage - 1))}
                                        disabled={attendancePage === 1 || attendanceLoading}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => onPageChange(Math.min(totalPages, attendancePage + 1))}
                                        disabled={attendancePage === totalPages || attendanceLoading}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar as CalendarIcon, ShieldCheck, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Employee } from '@/types/employee.type'
import type { ShiftAssignment, AttendanceLog, PendingChangeItem } from '@/types/attendance.types'
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
    getShiftDays: (s: ShiftAssignment | PendingChangeItem) => string;
    handleCancelPendingShift: (id: string) => void;
    setIsChangeScheduleOpen: (isOpen: boolean) => void;
}

export function AttendanceTab({
    employee,
    pendingShifts,
    attendanceLogs,
    getShiftDays,
    handleCancelPendingShift,
    setIsChangeScheduleOpen,
}: AttendanceTabProps) {
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
                    <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Recent Attendance History</h3>
                        <Badge variant="secondary" className="font-semibold text-[10px]">
                            LAST {attendanceLogs.length} ENTRIES
                        </Badge>
                    </div>
                    <CardContent className="p-0">
                        {attendanceLogs.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/10">
                                        <TableHead className="font-bold text-xs uppercase">Date</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Scheduled</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Time In</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Time Out</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Hours</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium text-sm">
                                                {format(new Date(log.workDate), 'PP')}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.scheduledInAt && log.scheduledOutAt ? (
                                                    `${format(new Date(log.scheduledInAt), 'p')} - ${format(new Date(log.scheduledOutAt), 'p')}`
                                                ) : 'Unscheduled'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.actualInAt ? format(new Date(log.actualInAt), 'p') : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.actualOutAt ? format(new Date(log.actualOutAt), 'p') : (
                                                    <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-200 bg-amber-50">OPEN</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.totalHours || '0.00'}h
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tight">
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center text-muted-foreground italic">
                                <p className="text-sm">No attendance records found for this employee.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

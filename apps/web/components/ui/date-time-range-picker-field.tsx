'use client'

import * as React from 'react'
import { format, setHours, setMinutes } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type DateTimeRangePickerFieldProps = {
    label: string
    startAt: string | null | undefined // ISO string or YYYY-MM-DDTHH:mm
    endAt: string | null | undefined
    onChangeAction: (start: string, end: string) => void
    required?: boolean
    disabled?: boolean
    error?: string
    placeholder?: string
    displayFormat?: string
}

export function DateTimeRangePickerField({
    label,
    startAt,
    endAt,
    onChangeAction,
    required,
    disabled,
    error,
    placeholder = 'Pick date and time range',
    displayFormat = 'MMM d, yyyy h:mm a',
}: DateTimeRangePickerFieldProps) {
    const [open, setOpen] = React.useState(false)

    // Internal state for time inputs to avoid unwanted updates during typing
    const [startTime, setStartTime] = React.useState('09:00')
    const [endTime, setEndTime] = React.useState('18:00')

    const dateRange: DateRange | undefined = React.useMemo(() => {
        if (!startAt || !endAt) return undefined
        return {
            from: new Date(startAt),
            to: new Date(endAt),
        }
    }, [startAt, endAt])

    // Sync internal time state when props change
    React.useEffect(() => {
        if (startAt) {
            setStartTime(format(new Date(startAt), 'HH:mm'))
        }
        if (endAt) {
            setEndTime(format(new Date(endAt), 'HH:mm'))
        }
    }, [startAt, endAt])

    const handleDateSelect = (range: DateRange | undefined) => {
        if (!range?.from) return

        const newStart = combineDateAndTime(range.from, startTime)
        const newEnd = range.to ? combineDateAndTime(range.to, endTime) : newStart

        onChangeAction(
            newStart.toISOString(),
            newEnd.toISOString()
        )
    }

    const handleTimeChange = (type: 'start' | 'end', timeStr: string) => {
        if (type === 'start') setStartTime(timeStr)
        else setEndTime(timeStr)

        if (!dateRange?.from) return

        const newStart = type === 'start' 
            ? combineDateAndTime(dateRange.from, timeStr)
            : combineDateAndTime(dateRange.from, startTime)
        
        const newEnd = type === 'end'
            ? combineDateAndTime(dateRange.to || dateRange.from, timeStr)
            : combineDateAndTime(dateRange.to || dateRange.from, endTime)

        onChangeAction(
            newStart.toISOString(),
            newEnd.toISOString()
        )
    }

    function combineDateAndTime(date: Date, timeStr: string): Date {
        const [hours, minutes] = timeStr.split(':').map(Number)
        let newDate = new Date(date)
        newDate = setHours(newDate, hours || 0)
        newDate = setMinutes(newDate, minutes || 0)
        return newDate
    }

    return (
        <div className="space-y-1">
            <label className="text-sm font-medium leading-none">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            'w-full justify-start text-left font-normal h-9',
                            (!startAt || !endAt) && 'text-muted-foreground',
                            error && 'border-red-500',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startAt && endAt ? (
                            <>
                                {format(new Date(startAt), displayFormat)} -{' '}
                                {format(new Date(endAt), displayFormat)}
                            </>
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                    <div className="flex flex-col sm:flex-row">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleDateSelect}
                            numberOfMonths={1}
                        />
                        <div className="p-4 border-t sm:border-t-0 sm:border-l border-border space-y-4 w-full sm:w-48 bg-muted/5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> Start Time
                                </Label>
                                <Input 
                                    type="time" 
                                    value={startTime} 
                                    onChange={(e) => handleTimeChange('start', e.target.value)}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> End Time
                                </Label>
                                <Input 
                                    type="time" 
                                    value={endTime} 
                                    onChange={(e) => handleTimeChange('end', e.target.value)}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                            <div className="pt-2">
                                <Button 
                                    className="w-full h-8 text-[10px] font-bold uppercase" 
                                    onClick={() => setOpen(false)}
                                    disabled={!dateRange?.from || !dateRange?.to}
                                >
                                    Apply Range
                                </Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

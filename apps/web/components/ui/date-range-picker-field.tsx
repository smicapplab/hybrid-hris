'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type DateRangePickerFieldProps = {
    label: string
    startDate: string | null | undefined
    endDate: string | null | undefined
    onChangeAction: (start: string, end: string) => void
    required?: boolean
    disabled?: boolean
    error?: string
    placeholder?: string
    displayFormat?: string
    fromYear?: number
    toYear?: number
    fromDate?: Date
    toDate?: Date
}

export function DateRangePickerField({
    label,
    startDate,
    endDate,
    onChangeAction,
    required,
    disabled,
    error,
    placeholder = 'Pick a date range',
    displayFormat = 'MMM d, yyyy',
    fromYear,
    toYear,
    fromDate,
    toDate,
}: DateRangePickerFieldProps) {
    const [open, setOpen] = React.useState(false)

    const dateRange: DateRange | undefined = React.useMemo(() => {
        if (!startDate || !endDate) return undefined
        return {
            from: new Date(startDate),
            to: new Date(endDate),
        }
    }, [startDate, endDate])

    const handleSelect = (range: DateRange | undefined) => {
        if (!range?.from || !range?.to) return
        onChangeAction(
            format(range.from, 'yyyy-MM-dd'),
            format(range.to, 'yyyy-MM-dd')
        )
        // We only close if both dates are selected
        if (range.from && range.to) {
            // setOpen(false) // Optionally keep open to allow refinement
        }
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
                            (!startDate || !endDate) && 'text-muted-foreground',
                            error && 'border-red-500',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate && endDate ? (
                            <>
                                {format(new Date(startDate), displayFormat)} -{' '}
                                {format(new Date(endDate), displayFormat)}
                            </>
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                            if (range?.from && range?.to) {
                                onChangeAction(
                                    format(range.from, 'yyyy-MM-dd'),
                                    format(range.to, 'yyyy-MM-dd')
                                )
                            } else if (range?.from) {
                                // Just one date selected, maybe clear or wait
                            }
                        }}
                        numberOfMonths={2}
                        fromYear={fromYear}
                        toYear={toYear}
                        fromDate={fromDate}
                        toDate={toDate}
                    />
                </PopoverContent>
            </Popover>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

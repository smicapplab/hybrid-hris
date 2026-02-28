'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type DatePickerFieldProps = {
    label: string
    value: string | null | undefined
    onChangeAction: (value: string) => void
    required?: boolean
    disabled?: boolean
    error?: string
    placeholder?: string
    displayFormat?: string
    captionLayout?: 'label' | 'dropdown'
    fromYear?: number
    toYear?: number
    fromDate?: Date
    toDate?: Date
    defaultMonth?: Date
}

export function DatePickerField({
    label,
    value,
    onChangeAction,
    required,
    disabled,
    error,
    placeholder = 'Pick a date',
    displayFormat = 'MMM d, yyyy',
    captionLayout = 'label',
    fromYear,
    toYear,
    fromDate,
    toDate,
    defaultMonth,
}: DatePickerFieldProps) {
    const [open, setOpen] = useState(false)

    const resolvedDefaultMonth = defaultMonth ?? (value ? new Date(value) : undefined)

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
                            'w-full justify-start text-left font-normal',
                            !value && 'text-muted-foreground',
                            error && 'border-red-500',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? format(new Date(value), displayFormat) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={value ? new Date(value) : undefined}
                        defaultMonth={resolvedDefaultMonth}
                        captionLayout={captionLayout}
                        fromYear={fromYear}
                        toYear={toYear}
                        fromDate={fromDate}
                        toDate={toDate}
                        onSelect={(date) => {
                            if (!date) return
                            onChangeAction(format(date, 'yyyy-MM-dd'))
                            setOpen(false)
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

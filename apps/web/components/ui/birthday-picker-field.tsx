'use client'

import { DatePickerField } from '@/components/ui/date-picker-field'

type BirthdayPickerFieldProps = {
    value: string | null | undefined
    onChangeAction: (value: string) => void
    label?: string
}

export function BirthdayPickerField({
    value,
    onChangeAction,
    label = 'Birthday',
}: BirthdayPickerFieldProps) {
    const today = new Date()
    const fromYear = today.getFullYear() - 80
    const toYear = today.getFullYear() - 10
    const toDate = new Date(toYear, today.getMonth(), today.getDate())

    return (
        <DatePickerField
            label={label}
            value={value}
            onChangeAction={onChangeAction}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
            toDate={toDate}
            defaultMonth={value ? new Date(value) : toDate}
        />
    )
}

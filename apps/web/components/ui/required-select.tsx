'use client'

import { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type RequiredSelectProps = {
    label?: string
    value: string
    onChangeAction: (value: string) => void
    required?: boolean
    touched?: boolean
    errorMessage?: string
    helperText?: ReactNode
    disabled?: boolean
    placeholder?: string
    className?: string
    children: ReactNode
}

export function RequiredSelect({
    label,
    value,
    onChangeAction,
    required = false,
    touched = false,
    errorMessage,
    helperText,
    disabled,
    placeholder,
    className,
    children,
}: RequiredSelectProps) {
    const isInvalid =
        required &&
        touched &&
        (!value || value.trim().length === 0)

    return (
        <div className={cn('space-y-1', className)}>
            <Label>
                {label}
                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
            </Label>

            <Select
                value={value}
                onValueChange={onChangeAction}
                disabled={disabled}
            >
                <SelectTrigger
                    className={cn(
                        'w-full',
                        isInvalid &&
                        'border-red-500 focus-visible:ring-red-500'
                    )}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {children}
                </SelectContent>
            </Select>

            {helperText && (
                <p className="text-xs text-muted-foreground">
                    {helperText}
                </p>
            )}

            {isInvalid && errorMessage && (
                <p className="text-xs text-red-500">
                    {errorMessage}
                </p>
            )}
        </div>
    )
}

// Usage example:
// <RequiredSelect
//   label="Employment Type"
//   value={employmentType}
//   onChangeAction={setEmploymentType}
//   required
//   touched={touched}
//   errorMessage="Employment type is required"
// >
//   <SelectItem value="REGULAR">Regular</SelectItem>
//   <SelectItem value="PROBATIONARY">Probationary</SelectItem>
// </RequiredSelect>

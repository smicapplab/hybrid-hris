'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type RequiredInputProps = {
    label: string
    value: string
    onChangeAction: (value: string) => void
    placeholder?: string
    required?: boolean
    touched?: boolean
    errorMessage?: string
    helperText?: ReactNode
    disabled?: boolean
    className?: string
}

export function RequiredInput({
    label,
    value,
    onChangeAction,
    placeholder,
    required = false,
    touched = false,
    errorMessage,
    helperText,
    disabled,
    className,
}: RequiredInputProps) {
    const isInvalid =
        required &&
        touched &&
        value.trim().length === 0

    return (
        <div className={cn("space-y-1", className)}>
            <Label>
                {label}
                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
            </Label>

            <Input
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => onChangeAction(e.target.value)}
                className={cn(
                    isInvalid && "border-red-500 focus-visible:ring-red-500"
                )}
            />

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
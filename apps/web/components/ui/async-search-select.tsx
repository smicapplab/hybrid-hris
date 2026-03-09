'use client'

import { useEffect, useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'

export interface AsyncSearchSelectProps<T> {
    label?: string
    value: string | null | undefined
    onChangeAction: (value: string | null) => void
    fetchOptions: (search: string) => Promise<T[]>
    getOptionValue: (option: T) => string
    getOptionLabel: (option: T) => string
    placeholder?: string
    disabled?: boolean
    excludeIds?: string[]
}

export function AsyncSearchSelect<T>({
    label,
    value,
    onChangeAction,
    fetchOptions,
    getOptionValue,
    getOptionLabel,
    placeholder = 'Search...',
    disabled,
    excludeIds = [],
}: AsyncSearchSelectProps<T>) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [options, setOptions] = useState<T[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Fetch when opened
        if (!open) return

        const timeout = setTimeout(async () => {
            setLoading(true)
            try {
                const results = await fetchOptions(search || '')
                setOptions(results)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timeout)
    }, [search, open, fetchOptions])

    // Ensure selected value is loaded so label can render
    useEffect(() => {
        if (!value) return

        const exists = options.some(
            (opt) => getOptionValue(opt) === value
        )

        if (exists) return

            ; (async () => {
                try {
                    const results = await fetchOptions('')
                    setOptions(results)
                } catch {
                    // silently ignore
                }
            })()
    }, [value, options, fetchOptions, getOptionValue])

    const filteredOptions = useMemo(() => {
        return options.filter(
            (opt) => !excludeIds.includes(getOptionValue(opt))
        )
    }, [options, excludeIds, getOptionValue])

    const selectedOption = useMemo(() => {
        return options.find((opt) => getOptionValue(opt) === value)
    }, [options, value, getOptionValue])

    return (
        <div className="space-y-1">
            {label && (
                <label className="text-sm font-medium">
                    {label}
                </label>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        disabled={disabled}
                    >
                        {selectedOption
                            ? getOptionLabel(selectedOption)
                            : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput
                            placeholder={placeholder}
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            {loading && (
                                <div className="p-2 text-sm text-muted-foreground">
                                    Loading...
                                </div>
                            )}
                            {!loading && filteredOptions.length === 0 && (
                                <CommandEmpty>No results found</CommandEmpty>
                            )}
                            {filteredOptions.map((option) => {
                                const optionValue = getOptionValue(option)
                                return (
                                    <CommandItem
                                        key={optionValue}
                                        onSelect={() => {
                                            onChangeAction(optionValue)
                                            setOpen(false)
                                        }}
                                    >
                                        {getOptionLabel(option)}
                                    </CommandItem>
                                )
                            })}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

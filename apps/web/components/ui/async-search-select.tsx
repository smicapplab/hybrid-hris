'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
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
    const lastFetchedValue = useRef<string | null | undefined>(null)

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
    // BREAKS INFINITE LOOP: removed 'options' and 'getOptionValue' from dependencies
    useEffect(() => {
        if (!value || lastFetchedValue.current === value) return

        const loadInitial = async () => {
            try {
                const results = await fetchOptions('')
                setOptions(results)
                lastFetchedValue.current = value
            } catch {
                // silently ignore
            }
        }
        
        loadInitial()
    }, [value, fetchOptions])

    const filteredOptions = useMemo(() => {
        return options.filter(
            (opt) => !excludeIds.includes(getOptionValue(opt))
        )
    }, [options, excludeIds, getOptionValue])

    const selectedOption = useMemo(() => {
        return options.find((opt) => getOptionValue(opt) === value)
    }, [options, value, getOptionValue])

    return (
        <div className="space-y-1 text-foreground">
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
                        className="w-full justify-between bg-background"
                        disabled={disabled}
                    >
                        <span className="truncate">
                            {selectedOption
                                ? getOptionLabel(selectedOption)
                                : placeholder}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command className="bg-background text-foreground border shadow-md">
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
                                        className="text-foreground"
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

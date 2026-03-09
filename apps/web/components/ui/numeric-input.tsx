'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number;
    onChangeAction: (val: number) => void;
    mode?: 'int' | 'float';
    precision?: number;
}

/**
 * NumericInput with live thousands separation masking.
 */
export function NumericInput({
    value,
    onChangeAction,
    mode = 'int',
    precision = 2,
    className,
    ...props
}: NumericInputProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = React.useState('');

    // Update display value when external value changes
    React.useEffect(() => {
        const formatted = formatNumber(value, mode === 'int' ? 0 : precision);
        setDisplayValue(formatted === '-' ? '0' : formatted);
    }, [value, mode, precision]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        
        // 1. Strip commas for internal processing
        const strippedValue = rawValue.replace(/,/g, '');

        // 2. Validate input pattern (allows leading minus, digits, and one decimal point if float)
        const pattern = mode === 'int' ? /^-?\d*$/ : /^-?\d*\.?\d*$/;
        if (!pattern.test(strippedValue) && strippedValue !== '') {
            return;
        }

        // 3. Keep track of cursor position from the RIGHT to handle jumps
        const selectionStart = e.target.selectionStart || 0;
        const offsetFromEnd = rawValue.length - selectionStart;

        // 4. Update internal numeric value
        const parsed = mode === 'int' ? parseInt(strippedValue, 10) : parseFloat(strippedValue);
        const finalNumericVal = isNaN(parsed) ? 0 : parsed;
        
        // Notify parent immediately
        onChangeAction(finalNumericVal);

        // 5. Update local display state with live masking
        // We use a separate formatting for "typing" state to allow trailing dots
        let masked = '';
        if (strippedValue === '' || strippedValue === '-') {
            masked = strippedValue;
        } else {
            const parts = strippedValue.split('.');
            const integerPart = parts[0];
            const decimalPart = parts.length > 1 ? parts[1] : null;

            // Format integer part with commas
            const formattedInt = new Intl.NumberFormat('en-US').format(parseInt(integerPart, 10) || 0);
            
            masked = decimalPart !== null 
                ? `${formattedInt}.${decimalPart.substring(0, precision)}` 
                : formattedInt;
            
            // Restore leading minus if parseInt stripped it (for "-0" case)
            if (integerPart === '-0' && !masked.startsWith('-')) masked = '-' + masked;
        }

        setDisplayValue(masked);

        // 6. Restore cursor position relative to the end
        // This prevents the cursor from jumping to the end when a comma is inserted
        window.requestAnimationFrame(() => {
            if (inputRef.current) {
                const newPos = Math.max(0, masked.length - offsetFromEnd);
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        });
    };

    const handleBlur = () => {
        // Final cleanup on blur (apply full precision formatting)
        const formatted = formatNumber(value, mode === 'int' ? 0 : precision);
        setDisplayValue(formatted === '-' ? '0' : formatted);
    };

    return (
        <Input
            {...props}
            ref={inputRef}
            type="text"
            className={cn("text-right font-mono", className)}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
        />
    );
}

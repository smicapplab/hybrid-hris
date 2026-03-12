'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface LandlineInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: string | undefined;
  onChangeAction: (value: string) => void;
  error?: boolean;
}

/**
 * PH Landline Number Formatter
 * Formats to: (63) X-XXXX-XXXX
 */
export function LandlineInput({ value, onChangeAction, className, error, ...props }: LandlineInputProps) {
  const displayValue = React.useMemo(() => {
    if (!value || value.trim() === '') return '(63) ';
    return value;
  }, [value]);

  const formatLandline = (input: string) => {
    // Extract only digits
    let digits = input.replace(/\D/g, '');
    
    // If it starts with 63, keep only the parts after 63
    if (digits.startsWith('63')) {
        digits = digits.substring(2);
    }

    // Limit to 9 digits (1 for area code + 8 for number)
    const part = digits.substring(0, 9);
    
    let formatted = '(63) ';
    if (part.length > 0) {
        formatted += part.substring(0, 1); // Area code
    }
    if (part.length > 1) {
        formatted += '-' + part.substring(1, 5); // First 4 digits
    }
    if (part.length > 5) {
        formatted += '-' + part.substring(5, 9); // Last 4 digits
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Prevent deleting the (63) prefix
    if (rawVal.length < 5) {
        onChangeAction('(63) ');
        return;
    }

    const formatted = formatLandline(rawVal);
    onChangeAction(formatted);
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      className={cn(
        "font-mono", 
        error && "border-red-500 focus-visible:ring-red-500",
        className
      )}
      placeholder="(63) X-XXXX-XXXX"
    />
  );
}

/**
 * Utility to validate PH landline number string
 * Expected: (63) X-XXXX-XXXX (15-16 chars)
 */
export function isValidPHLandline(phone: string | null | undefined): boolean {
    if (!phone || phone === '(63) ') return true; // Optional
    const digits = phone.replace(/\D/g, '');
    // Usually 63 + 1 (area) + 7 or 8 digits = 10 or 11 total digits
    return digits.length >= 10 && digits.length <= 11 && digits.startsWith('63');
}

export function cleanLandline(phone: string): string {
    if (phone === '(63) ') return '';
    return phone.trim();
}

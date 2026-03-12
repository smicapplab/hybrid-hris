'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: string | undefined;
  onChangeAction: (value: string) => void;
  error?: boolean;
}

/**
 * PH Mobile Number Formatter
 * Formats to: (+63) 9XX-XXX-XXXX
 */
export function PhoneInput({ value, onChangeAction, className, error, ...props }: PhoneInputProps) {
  // Normalize value: ensure it starts with (+63) 9 if possible
  const displayValue = React.useMemo(() => {
    if (!value || value.trim() === '') return '(+63) 9';
    return value;
  }, [value]);

  const formatPhoneNumber = (input: string) => {
    // Extract only digits
    let digits = input.replace(/\D/g, '');
    
    // If it starts with 63, keep only the parts after 63
    if (digits.startsWith('63')) {
        digits = digits.substring(2);
    }

    // PH mobile numbers always start with 9 after the country code
    // If the first digit is not 9, we force it to be 9 or empty it
    if (digits.length > 0 && digits[0] !== '9') {
        digits = '9' + digits.substring(0, 9);
    }

    // Limit to 10 digits total (9XX XXX XXXX)
    const part = digits.substring(0, 10);
    
    let formatted = '(+63) ';
    if (part.length > 0) {
        formatted += part.substring(0, 3); // 9XX
    }
    if (part.length > 3) {
        formatted += '-' + part.substring(3, 6); // XXX
    }
    if (part.length > 6) {
        formatted += '-' + part.substring(6, 10); // XXXX
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Logic to prevent deleting the (+63) 9 prefix
    // If they try to backspace into the prefix, force it back
    if (rawVal.length < 7) {
        onChangeAction('(+63) 9');
        return;
    }

    const formatted = formatPhoneNumber(rawVal);
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
      placeholder="(+63) 9XX-XXX-XXXX"
    />
  );
}

/**
 * Utility to validate PH mobile number string
 * Expected: (+63) 9XX-XXX-XXXX (17 chars)
 */
export function isValidPHMobile(phone: string | null | undefined): boolean {
    if (!phone) return true; // Optional fields
    const digits = phone.replace(/\D/g, '');
    // Must be 12 digits (63 + 9XXXXXXXXX)
    return digits.length === 12 && digits.startsWith('639');
}

/**
 * Utility to clean phone number for storage
 * Ensures no trailing dashes if incomplete, but we usually want the full format
 */
export function cleanPhoneNumber(phone: string): string {
    if (phone === '(+63) 9') return '';
    return phone.trim();
}

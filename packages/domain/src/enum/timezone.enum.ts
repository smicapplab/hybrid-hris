export const TIMEZONES = [
    'UTC',

    // Asia Pacific
    'Asia/Manila',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Taipei',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Bangkok',
    'Asia/Jakarta',
    'Asia/Kuala_Lumpur',
    'Asia/Ho_Chi_Minh',
    'Asia/Kolkata',
    'Asia/Dhaka',
    'Asia/Dubai',
    'Asia/Riyadh',

    // Europe
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Helsinki',
    'Europe/Moscow',

    // Americas
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Sao_Paulo',
    'America/Mexico_City',

    // Oceania
    'Australia/Sydney',
    'Australia/Perth',
    'Pacific/Auckland',
    'Pacific/Honolulu',
] as const

export type Timezone = (typeof TIMEZONES)[number]

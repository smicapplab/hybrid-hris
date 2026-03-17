export const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'NON_BINARY', label: 'Non-binary' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

export const CIVIL_STATUS_OPTIONS = [
    { value: 'SINGLE', label: 'Single' },
    { value: 'MARRIED', label: 'Married' },
    { value: 'SEPARATED', label: 'Separated' },
    { value: 'WIDOWED', label: 'Widowed' },
    { value: 'ANNULLED', label: 'Annulled' },
]

export const NATIONALITY_OPTIONS = [
    'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan',
    'Argentine', 'Armenian', 'Australian', 'Austrian', 'Azerbaijani',
    'Bahraini', 'Bangladeshi', 'Belgian', 'Bolivian', 'Bosnian',
    'Brazilian', 'British', 'Bulgarian', 'Cambodian', 'Canadian',
    'Chilean', 'Chinese', 'Colombian', 'Congolese', 'Croatian', 'Cuban',
    'Czech', 'Danish', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian',
    'Emirati', 'Estonian', 'Ethiopian', 'Filipino', 'Finnish', 'French',
    'Georgian', 'German', 'Ghanaian', 'Greek', 'Guatemalan', 'Haitian',
    'Honduran', 'Hungarian', 'Indian', 'Indonesian', 'Iranian', 'Iraqi',
    'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese',
    'Jordanian', 'Kazakh', 'Kenyan', 'Korean', 'Kuwaiti', 'Lebanese',
    'Libyan', 'Lithuanian', 'Luxembourgish', 'Malaysian', 'Maldivian',
    'Mexican', 'Moldovan', 'Mongolian', 'Moroccan', 'Mozambican',
    'Namibian', 'Nepalese', 'New Zealander', 'Nigerian', 'Norwegian',
    'Omani', 'Pakistani', 'Panamanian', 'Paraguayan', 'Peruvian',
    'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan',
    'Saudi Arabian', 'Senegalese', 'Serbian', 'Singaporean', 'Slovak',
    'Slovenian', 'Somali', 'South African', 'Spanish', 'Sri Lankan',
    'Sudanese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tanzanian',
    'Thai', 'Tunisian', 'Turkish', 'Ugandan', 'Ukrainian', 'Uruguayan',
    'Uzbek', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
]


export const COUNTRY_OPTIONS = [
    { code: 'PH', name: 'Philippines' },
    { code: 'AU', name: 'Australia' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'CA', name: 'Canada' },
    { code: 'CN', name: 'China' },
    { code: 'EG', name: 'Egypt' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'MX', name: 'Mexico' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'QA', name: 'Qatar' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'VN', name: 'Vietnam' },
]

export const TIMEZONE_OPTIONS = [
    { value: 'UTC',                  label: 'UTC' },
    // Asia Pacific
    { value: 'Asia/Manila',          label: 'Asia/Manila — PHT (UTC+8)' },
    { value: 'Asia/Singapore',       label: 'Asia/Singapore — SGT (UTC+8)' },
    { value: 'Asia/Hong_Kong',       label: 'Asia/Hong_Kong — HKT (UTC+8)' },
    { value: 'Asia/Taipei',          label: 'Asia/Taipei — CST (UTC+8)' },
    { value: 'Asia/Tokyo',           label: 'Asia/Tokyo — JST (UTC+9)' },
    { value: 'Asia/Seoul',           label: 'Asia/Seoul — KST (UTC+9)' },
    { value: 'Asia/Shanghai',        label: 'Asia/Shanghai — CST (UTC+8)' },
    { value: 'Asia/Bangkok',         label: 'Asia/Bangkok — ICT (UTC+7)' },
    { value: 'Asia/Jakarta',         label: 'Asia/Jakarta — WIB (UTC+7)' },
    { value: 'Asia/Kuala_Lumpur',    label: 'Asia/Kuala_Lumpur — MYT (UTC+8)' },
    { value: 'Asia/Ho_Chi_Minh',     label: 'Asia/Ho_Chi_Minh — ICT (UTC+7)' },
    { value: 'Asia/Kolkata',         label: 'Asia/Kolkata — IST (UTC+5:30)' },
    { value: 'Asia/Dhaka',           label: 'Asia/Dhaka — BST (UTC+6)' },
    { value: 'Asia/Dubai',           label: 'Asia/Dubai — GST (UTC+4)' },
    { value: 'Asia/Riyadh',          label: 'Asia/Riyadh — AST (UTC+3)' },
    // Europe
    { value: 'Europe/London',        label: 'Europe/London — GMT/BST' },
    { value: 'Europe/Paris',         label: 'Europe/Paris — CET (UTC+1)' },
    { value: 'Europe/Berlin',        label: 'Europe/Berlin — CET (UTC+1)' },
    { value: 'Europe/Amsterdam',     label: 'Europe/Amsterdam — CET (UTC+1)' },
    { value: 'Europe/Rome',          label: 'Europe/Rome — CET (UTC+1)' },
    { value: 'Europe/Madrid',        label: 'Europe/Madrid — CET (UTC+1)' },
    { value: 'Europe/Helsinki',      label: 'Europe/Helsinki — EET (UTC+2)' },
    { value: 'Europe/Moscow',        label: 'Europe/Moscow — MSK (UTC+3)' },
    // Americas
    { value: 'America/New_York',     label: 'America/New_York — EST/EDT' },
    { value: 'America/Chicago',      label: 'America/Chicago — CST/CDT' },
    { value: 'America/Denver',       label: 'America/Denver — MST/MDT' },
    { value: 'America/Los_Angeles',  label: 'America/Los_Angeles — PST/PDT' },
    { value: 'America/Toronto',      label: 'America/Toronto — EST/EDT' },
    { value: 'America/Vancouver',    label: 'America/Vancouver — PST/PDT' },
    { value: 'America/Sao_Paulo',    label: 'America/Sao_Paulo — BRT (UTC-3)' },
    { value: 'America/Mexico_City',  label: 'America/Mexico_City — CST/CDT' },
    // Oceania
    { value: 'Australia/Sydney',     label: 'Australia/Sydney — AEST/AEDT' },
    { value: 'Australia/Perth',      label: 'Australia/Perth — AWST (UTC+8)' },
    { value: 'Pacific/Auckland',     label: 'Pacific/Auckland — NZST/NZDT' },
    { value: 'Pacific/Honolulu',     label: 'Pacific/Honolulu — HST (UTC-10)' },
] as const

export const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
    PROBATION: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Probation' },
    SUSPENDED: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Suspended' },
    RESIGNED: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Resigned' },
    TERMINATED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Terminated' },
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    REGULAR: 'Regular', PROBATIONARY: 'Probationary', CONTRACTUAL: 'Contractual',
    CONSULTANT: 'Consultant', INTERN: 'Intern',
}

export const PROFICIENCY_LEVEL_OPTIONS = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' },
]

/** Combined Tailwind classes for inline status badge components (bg + text + border) */
export const EMPLOYEE_STATUS_BADGE: Record<string, string> = {
    ACTIVE:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    PROBATION:  'bg-amber-50 text-amber-700 border-amber-200',
    SUSPENDED:  'bg-orange-50 text-orange-700 border-orange-200',
    INACTIVE:   'bg-zinc-100 text-zinc-600 border-zinc-200',
    RESIGNED:   'bg-zinc-100 text-zinc-600 border-zinc-200',
    TERMINATED: 'bg-red-50 text-red-700 border-red-200',
}

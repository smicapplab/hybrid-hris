import type {
    EmployeeProfile,
    EmployeeIdentifiers,
} from '@/types/employee.type'

export const DEFAULT_PROFILE: EmployeeProfile = {
    employeeId: '',
    birthDate: null,
    gender: null,
    civilStatus: null,
    nationality: null,
    personalEmail: null,
    mobileNo: null,
    landlineNo: null,
    emergencyContactName: null,
    emergencyContactRelationship: null,
    emergencyContactMobileNo: null,
    notes: null,
}

export const DEFAULT_IDENTIFIERS: EmployeeIdentifiers = {
    employeeId: '',
    tinNo: null,
    sssNo: null,
    philHealthNo: null,
    pagIbigNo: null,
    umidNo: null,
    passportNo: null,
    passportExpiry: null,
    driversLicenseNo: null,
    driversLicenseExpiry: null,
    prcLicenseNo: null,
    prcLicenseExpiry: null,
    companyIdNo: null,
}

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

export const COUNTRY_OPTIONS = [
    // Southeast Asia
    { code: 'PH', label: 'Philippines' },
    { code: 'SG', label: 'Singapore' },
    { code: 'MY', label: 'Malaysia' },
    { code: 'TH', label: 'Thailand' },
    { code: 'ID', label: 'Indonesia' },
    { code: 'VN', label: 'Vietnam' },

    // East Asia
    { code: 'JP', label: 'Japan' },
    { code: 'KR', label: 'South Korea' },
    { code: 'CN', label: 'China' },
    { code: 'HK', label: 'Hong Kong' },
    { code: 'TW', label: 'Taiwan' },

    // South Asia
    { code: 'IN', label: 'India' },
    { code: 'PK', label: 'Pakistan' },
    { code: 'BD', label: 'Bangladesh' },
    { code: 'LK', label: 'Sri Lanka' },

    // Oceania
    { code: 'AU', label: 'Australia' },
    { code: 'NZ', label: 'New Zealand' },

    // North America
    { code: 'US', label: 'United States' },
    { code: 'CA', label: 'Canada' },
] as const
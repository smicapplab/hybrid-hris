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
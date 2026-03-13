export interface TeamMemberInfo {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string;
    positionTitle: string | null;
    status: string;
}

export interface PaginatedTeamMembersResponse {
    data: TeamMemberInfo[];
    total: number;
    hasMore: boolean;
}

export interface MyProfileResponse {
    email: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    alternateEmail: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    countryCode: string;
    birthDate: string | null;
    gender: string | null;
    civilStatus: string | null;
    nationality: string | null;
    personalEmail: string | null;
    mobileNo: string | null;
    landlineNo: string | null;
    emergencyContactName: string | null;
    emergencyContactRelationship: string | null;
    emergencyContactMobileNo: string | null;
}

export interface OrgContextResponse {
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        employeeNo: string;
        hireDate: string;
        status: string;
        employmentType: string;
    };
    position: { id: string; title: string; code: string } | null;
    orgUnit: {
        id: string;
        name: string;
        code: string;
        path: string[];
    } | null;
    supervisor: { id: string; firstName: string; lastName: string; positionTitle: string | null } | null;
    directReports: { id: string; firstName: string; lastName: string; positionTitle: string | null }[];
    leaders: { id: string; employeeId: string; firstName: string; lastName: string; role: string; isPrimary: boolean }[];
    peers: { id: string; firstName: string; lastName: string; employeeNo: string; positionTitle: string | null; status: string }[];
}

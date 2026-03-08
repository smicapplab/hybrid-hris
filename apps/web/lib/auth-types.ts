export type JwtUser = {
    id: string;
    email: string;
    employeeId: string | null;
    orgUnitId: string | null;
    isSupervisor: boolean;
    isOrgLead: boolean;
    isRootLeader: boolean;
    firstName: string | null;
    lastName: string | null;
    roles: string[];
};

export type LoginResponse = {
    accessToken: string;
};

export type Role = {
    id: string;
    code: string;
    name: string;
    description: string | null;
};
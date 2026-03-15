export type User = {
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

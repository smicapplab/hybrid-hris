export type JwtUser = {
    id: string;
    email: string;
    employeeId: string | null;
    firstName: string | null;
    lastName: string | null;
    roles: string[];
};

export type LoginResponse = {
    accessToken: string;
};
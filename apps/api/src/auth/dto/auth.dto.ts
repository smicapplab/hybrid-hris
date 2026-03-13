export interface OAuthUser {
    id: string;
    email: string;
    employeeId: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

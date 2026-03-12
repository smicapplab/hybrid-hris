export type OrgLeaderRole = 'HEAD' | 'CO_HEAD' | 'ACTING_HEAD'

export interface OrgEmployee {
    id: string
    firstName: string
    lastName: string
    positionTitle: string
}

export interface OrgLeader {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    role: OrgLeaderRole
    isPrimary: boolean
}

export interface OrgContext {
    employee: {
        id: string
        firstName: string
        lastName: string
        employeeNo: string
        hireDate: string
        status: string
        employmentType: string
    }
    position: { id: string; title: string; code: string } | null
    orgUnit: { id: string; name: string; code: string; path: string[] } | null
    supervisor: OrgEmployee | null
    directReports: OrgEmployee[]
    leaders: OrgLeader[]
    peers: (OrgEmployee & { employeeNo: string; status: string })[]
}

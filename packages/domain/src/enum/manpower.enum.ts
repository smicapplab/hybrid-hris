export const MANPOWER_REQUEST_TYPES = [
    'NEW_HEADCOUNT',
    'REPLACEMENT',
    'PROJECT_BASED',
] as const;

export type ManpowerRequestType = (typeof MANPOWER_REQUEST_TYPES)[number];

export function isManpowerRequestType(v: string): v is ManpowerRequestType {
    return MANPOWER_REQUEST_TYPES.includes(v as ManpowerRequestType);
}

export const MANPOWER_REQUEST_STATUSES = [
    'DRAFT',
    'SUBMITTED',
    'SUBMITTED_TO_ROOT',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'CLOSED',
] as const;

export type ManpowerRequestStatus = (typeof MANPOWER_REQUEST_STATUSES)[number];

export function isManpowerRequestStatus(v: string): v is ManpowerRequestStatus {
    return MANPOWER_REQUEST_STATUSES.includes(v as ManpowerRequestStatus);
}

export const JOB_POSTING_STATUSES = [
    'DRAFT',
    'OPEN',
    'CLOSED',
] as const;

export type JobPostingStatus = (typeof JOB_POSTING_STATUSES)[number];

export function isJobPostingStatus(v: string): v is JobPostingStatus {
    return JOB_POSTING_STATUSES.includes(v as JobPostingStatus);
}

export const REQUEST_PRIORITIES = [
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT',
] as const;

export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export function isRequestPriority(v: string): v is RequestPriority {
    return REQUEST_PRIORITIES.includes(v as RequestPriority);
}

export const MANPOWER_APPROVAL_STATUSES = [
    'PENDING',
    'APPROVED',
    'REJECTED',
] as const;

export type ManpowerApprovalStatus = (typeof MANPOWER_APPROVAL_STATUSES)[number];

export function isManpowerApprovalStatus(v: string): v is ManpowerApprovalStatus {
    return MANPOWER_APPROVAL_STATUSES.includes(v as ManpowerApprovalStatus);
}

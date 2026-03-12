export const TRAINING_TYPES = [
    'INTERNAL',
    'EXTERNAL',
] as const;

export type TrainingType = (typeof TRAINING_TYPES)[number];

export function isTrainingType(v: string): v is TrainingType {
    return TRAINING_TYPES.includes(v as TrainingType);
}

export const TRAINING_ENROLLMENT_STATUSES = [
    'ENROLLED',
    'COMPLETED',
    'CANCELLED',
    'WAITLISTED',
    'DID_NOT_ATTEND',
] as const;

export type TrainingEnrollmentStatus = (typeof TRAINING_ENROLLMENT_STATUSES)[number];

export function isTrainingEnrollmentStatus(v: string): v is TrainingEnrollmentStatus {
    return TRAINING_ENROLLMENT_STATUSES.includes(v as TrainingEnrollmentStatus);
}

export const TRAINING_SCHEDULE_STATUSES = [
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
] as const;

export type TrainingScheduleStatus = (typeof TRAINING_SCHEDULE_STATUSES)[number];

export function isTrainingScheduleStatus(v: string): v is TrainingScheduleStatus {
    return TRAINING_SCHEDULE_STATUSES.includes(v as TrainingScheduleStatus);
}

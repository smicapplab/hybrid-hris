export const PROFICIENCY_LEVELS = [
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT',
] as const;

export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

export function isProficiencyLevel(v: string): v is ProficiencyLevel {
    return PROFICIENCY_LEVELS.includes(v as ProficiencyLevel);
}

export const SKILL_SOURCES = [
    'INTERNAL_TRAINING',
    'EXTERNAL_EXPERIENCE',
    'MANAGER_ASSIGNED',
] as const;

export type SkillSource = (typeof SKILL_SOURCES)[number];

export function isSkillSource(v: string): v is SkillSource {
    return SKILL_SOURCES.includes(v as SkillSource);
}

export const SKILL_VERIFICATION_STATUSES = [
    'PENDING',
    'VERIFIED',
    'REJECTED',
] as const;

export type SkillVerificationStatus = (typeof SKILL_VERIFICATION_STATUSES)[number];

export function isSkillVerificationStatus(v: string): v is SkillVerificationStatus {
    return SKILL_VERIFICATION_STATUSES.includes(v as SkillVerificationStatus);
}

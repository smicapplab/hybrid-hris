import type { OrgLeaderRole } from '@/types/org.type'

/** Human-readable label for each leader role */
export const ORG_LEADER_ROLE_LABEL: Record<OrgLeaderRole, string> = {
    HEAD: 'Head',
    CO_HEAD: 'Co-Head',
    ACTING_HEAD: 'Acting Head',
}

/** Tailwind badge classes for each leader role */
export const ORG_LEADER_ROLE_BADGE: Record<OrgLeaderRole, string> = {
    HEAD: 'bg-blue-50 text-blue-700 border-blue-200',
    CO_HEAD: 'bg-violet-50 text-violet-700 border-violet-200',
    ACTING_HEAD: 'bg-amber-50 text-amber-700 border-amber-200',
}

/** Selectable options for leader role dropdowns */
export const ORG_LEADER_ROLE_OPTIONS: { value: OrgLeaderRole; label: string }[] = [
    { value: 'HEAD', label: 'Head' },
    { value: 'CO_HEAD', label: 'Co-Head' },
    { value: 'ACTING_HEAD', label: 'Acting Head' },
]

import type { OrgUnit } from '@hybrid-hris/db/types';

export interface OrgUnitNode extends OrgUnit {
    children?: OrgUnitNode[];
    isDeletable: boolean;
}
export interface OrgUnitOption {
    id: string
    name: string
    code?: string
    path?: string
}
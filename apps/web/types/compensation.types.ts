export interface CompensationTemplate {
    id: string;
    code: string;
    name: string;
    description: string | null;
    jobLevelId: string | null;
    components: any[];
}

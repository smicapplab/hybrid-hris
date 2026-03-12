export interface Skill {
  id: string;
  categoryId: string;
  name: string;
  type: string;
  description: string | null;
  expiryMonths: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

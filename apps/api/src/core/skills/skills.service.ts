import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { skillCategories, skills, employeeSkills, employeeSkillEndorsements, employees, orgUnits } from '@hybrid-hris/db/schema';
import { and, eq, asc, sql, isNull, inArray } from 'drizzle-orm';
import { ProficiencyLevel } from '@hybrid-hris/domain';

@Injectable()
export class SkillsService {
  constructor(private readonly db: DatabaseService) {}

  // ... existing taxonomy methods ...

  // --- Employee Skills (Profile) ---

  async getEmployeeSkills(employeeId: string) {
    const results = await this.db.db
      .select({
        id: employeeSkills.id,
        skillId: skills.id,
        skillName: skills.name,
        skillType: skills.type,
        proficiencyLevel: employeeSkills.proficiencyLevel,
        source: employeeSkills.source,
        verificationStatus: employeeSkills.verificationStatus,
        acquiredDate: employeeSkills.acquiredDate,
        expiryDate: employeeSkills.expiryDate,
        evidenceUrl: employeeSkills.evidenceUrl,
        notes: employeeSkills.notes,
        verifiedAt: employeeSkills.verifiedAt,
      })
      .from(employeeSkills)
      .innerJoin(skills, eq(employeeSkills.skillId, skills.id))
      .where(eq(employeeSkills.employeeId, employeeId))
      .orderBy(asc(skills.name));

    // For each skill, get endorsements
    const skillIds = results.map(r => r.id);
    if (skillIds.length === 0) return [];

    const endorsements = await this.db.db
      .select({
        id: employeeSkillEndorsements.id,
        employeeSkillId: employeeSkillEndorsements.employeeSkillId,
        endorserId: employees.id,
        endorserName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
        message: employeeSkillEndorsements.message,
        createdAt: employeeSkillEndorsements.createdAt,
      })
      .from(employeeSkillEndorsements)
      .innerJoin(employees, eq(employeeSkillEndorsements.endorserId, employees.id))
      .where(inArray(employeeSkillEndorsements.employeeSkillId, skillIds));

    return results.map(r => ({
      ...r,
      endorsements: endorsements.filter(e => e.employeeSkillId === r.id),
    }));
  }

  async declareSkill(employeeId: string, data: {
    skillId: string;
    proficiencyLevel: ProficiencyLevel;
    acquiredDate: string;
    evidenceUrl?: string;
    notes?: string;
  }) {
    // Check if already has this skill
    const existing = await this.db.db
      .select()
      .from(employeeSkills)
      .where(and(eq(employeeSkills.employeeId, employeeId), eq(employeeSkills.skillId, data.skillId)))
      .limit(1);

    if (existing.length) {
      throw new ConflictException('You have already declared this skill');
    }

    const [inserted] = await this.db.db
      .insert(employeeSkills)
      .values({
        employeeId,
        skillId: data.skillId,
        proficiencyLevel: data.proficiencyLevel,
        source: 'EXTERNAL_EXPERIENCE',
        verificationStatus: 'PENDING',
        acquiredDate: data.acquiredDate,
        evidenceUrl: data.evidenceUrl ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    return inserted;
  }

  async removeSkill(employeeId: string, employeeSkillId: string) {
    const deleted = await this.db.db
      .delete(employeeSkills)
      .where(and(eq(employeeSkills.id, employeeSkillId), eq(employeeSkills.employeeId, employeeId)))
      .returning();

    if (!deleted.length) {
      throw new NotFoundException('Skill declaration not found');
    }

    return { success: true };
  }

  // --- Manager Skill Approvals ---

  async getPendingSkillsForManager(managerEmployeeId: string) {
    return this.db.db
      .select({
        id: employeeSkills.id,
        employeeId: employees.id,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeNo: employees.employeeNo,
        skillId: skills.id,
        skillName: skills.name,
        skillType: skills.type,
        proficiencyLevel: employeeSkills.proficiencyLevel,
        acquiredDate: employeeSkills.acquiredDate,
        evidenceUrl: employeeSkills.evidenceUrl,
        notes: employeeSkills.notes,
        createdAt: employeeSkills.createdAt,
      })
      .from(employeeSkills)
      .innerJoin(skills, eq(employeeSkills.skillId, skills.id))
      .innerJoin(employees, eq(employeeSkills.employeeId, employees.id))
      .where(
        and(
          eq(employees.supervisorId, managerEmployeeId),
          eq(employeeSkills.verificationStatus, 'PENDING'),
          isNull(employees.deletedAt)
        )
      )
      .orderBy(asc(employeeSkills.createdAt));
  }

  async processSkillApproval(
    employeeSkillId: string,
    managerEmployeeId: string,
    data: { status: 'VERIFIED' | 'REJECTED'; notes?: string }
  ) {
    // 1. Verify this is a pending skill for a direct report
    const result = await this.db.db
      .select({ id: employeeSkills.id })
      .from(employeeSkills)
      .innerJoin(employees, eq(employeeSkills.employeeId, employees.id))
      .where(
        and(
          eq(employeeSkills.id, employeeSkillId),
          eq(employees.supervisorId, managerEmployeeId),
          eq(employeeSkills.verificationStatus, 'PENDING')
        )
      )
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('Pending skill declaration not found for your direct reports');
    }

    const [updated] = await this.db.db
      .update(employeeSkills)
      .set({
        verificationStatus: data.status,
        notes: data.notes ? sql`${employeeSkills.notes} || '\nManager Note: ' || ${data.notes}` : employeeSkills.notes,
        verifiedById: managerEmployeeId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(employeeSkills.id, employeeSkillId))
      .returning();

    return updated;
  }

  // --- Taxonomy (Admin) ---

  // --- Categories ---

  async getAllCategories() {
    return this.db.db
      .select()
      .from(skillCategories)
      .orderBy(asc(skillCategories.name));
  }

  async createCategory(data: { name: string; description?: string }) {
    const existing = await this.db.db
      .select({ id: skillCategories.id })
      .from(skillCategories)
      .where(eq(skillCategories.name, data.name))
      .limit(1);

    if (existing.length) {
      throw new ConflictException(`Category '${data.name}' already exists`);
    }

    const inserted = await this.db.db
      .insert(skillCategories)
      .values({
        name: data.name,
        description: data.description ?? null,
      })
      .returning();

    return inserted[0];
  }

  async updateCategory(id: string, data: { name?: string; description?: string }) {
    const updated = await this.db.db
      .update(skillCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(skillCategories.id, id))
      .returning();

    if (!updated.length) {
      throw new NotFoundException('Category not found');
    }

    return updated[0];
  }

  // --- Skills ---

  async getSkillsByCategory(categoryId: string) {
    return this.db.db
      .select()
      .from(skills)
      .where(eq(skills.categoryId, categoryId))
      .orderBy(asc(skills.name));
  }

  async createSkill(data: {
    categoryId: string;
    name: string;
    type?: string;
    description?: string;
    expiryMonths?: number;
  }) {
    const existing = await this.db.db
      .select({ id: skills.id })
      .from(skills)
      .where(and(eq(skills.categoryId, data.categoryId), eq(skills.name, data.name)))
      .limit(1);

    if (existing.length) {
      throw new ConflictException(`Skill '${data.name}' already exists in this category`);
    }

    const inserted = await this.db.db
      .insert(skills)
      .values({
        categoryId: data.categoryId,
        name: data.name,
        type: data.type ?? 'TECHNICAL',
        description: data.description ?? null,
        expiryMonths: data.expiryMonths ?? null,
        isActive: true,
      })
      .returning();

    return inserted[0];
  }

  async updateSkill(
    id: string,
    data: {
      name?: string;
      type?: string;
      description?: string;
      expiryMonths?: number | null;
      isActive?: boolean;
    },
  ) {
    const updated = await this.db.db
      .update(skills)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id))
      .returning();

    if (!updated.length) {
      throw new NotFoundException('Skill not found');
    }

    return updated[0];
  }

  async getTaxonomy() {
    const categories = await this.getAllCategories();
    const allSkills = await this.db.db.select().from(skills).orderBy(asc(skills.name));

    return categories.map((cat) => ({
      ...cat,
      skills: allSkills.filter((s) => s.categoryId === cat.id),
    }));
  }
}

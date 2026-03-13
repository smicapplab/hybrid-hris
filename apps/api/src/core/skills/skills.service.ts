import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { 
  skillCategories, 
  skills, 
  employeeSkills, 
  employeeSkillEndorsements, 
  employees, 
  orgUnits, 
  positions, 
  positionSkills, 
  leaveRequests, 
  employeeShiftAssignments, 
  trainingEnrollments, 
  trainingPrograms, 
  trainingSchedules, 
  positionMandatoryTrainings,
  users
} from '@hybrid-hris/db/schema';
import { and, eq, asc, sql, isNull, inArray, gte } from 'drizzle-orm';
import { ProficiencyLevel } from '@hybrid-hris/domain';

export interface EndorsementInfo {
  id: string;
  employeeSkillId: string;
  endorserId: string;
  endorserName: string;
  message: string | null;
  createdAt: Date;
}

export interface EmployeeSkillInfo {
  id: string;
  skillId: string;
  skillName: string;
  skillType: string;
  proficiencyLevel: ProficiencyLevel;
  source: string;
  verificationStatus: string;
  acquiredDate: string;
  expiryDate: string | null;
  evidenceUrl: string | null;
  notes: string | null;
  verifiedAt: Date | null;
  endorsements?: EndorsementInfo[];
}

export interface TalentCardData {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string;
    positionId: string | null;
    positionTitle: string | null;
    orgUnitName: string | null;
    email: string | null;
    supervisorId: string | null;
  };
  skills: {
    actual: EmployeeSkillInfo[];
    required: { skillId: string; skillName: string; requiredLevel: string }[];
  };
  training: {
    enrollments: { id: string; status: string; programId: string; programTitle: string; startAt: Date }[];
    missingMandatory: { id: string; title: string }[];
  };
  upcomingLeaves: any[];
  schedule: any;
}

export interface TaxonomySkillInfo {
  id: string;
  name: string;
  type: string;
  description: string | null;
  expiryMonths: number | null;
  isActive: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxonomyCategoryInfo {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  skills: TaxonomySkillInfo[];
}

@Injectable()
export class SkillsService {
  constructor(private readonly db: DatabaseService) {}

  async getEmployeeTalentCard(employeeId: string, managerEmployeeId: string): Promise<TalentCardData> {
    // 1. Verify access (must be direct report or admin)
    const [employee] = await this.db.db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeNo: employees.employeeNo,
        positionId: employees.positionId,
        positionTitle: positions.title,
        orgUnitName: orgUnits.name,
        email: users.email,
        supervisorId: employees.supervisorId,
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
      .leftJoin(users, eq(employees.id, users.employeeId))
      .where(and(eq(employees.id, employeeId), isNull(employees.deletedAt)))
      .limit(1);

    if (!employee) throw new NotFoundException('Employee not found');
    
    // Security check: if not the manager, throw error
    if (employee.supervisorId !== managerEmployeeId) {
        throw new UnauthorizedException('You can only view talent cards for your direct reports');
    }

    // 2. Fetch Actual Skills
    const actualSkills = await this.getEmployeeSkills(employeeId);

    // 3. Fetch Position Requirements
    const requirements = employee.positionId ? await this.db.db
      .select({
        skillId: skills.id,
        skillName: skills.name,
        requiredLevel: positionSkills.requiredProficiencyLevel,
      })
      .from(positionSkills)
      .innerJoin(skills, eq(positionSkills.skillId, skills.id))
      .where(eq(positionSkills.positionId, employee.positionId)) : [];

    // 4. Fetch Training Roadmap
    const enrollments = await this.db.db
      .select({
        id: trainingEnrollments.id,
        status: trainingEnrollments.status,
        programId: trainingPrograms.id,
        programTitle: trainingPrograms.title,
        startAt: trainingSchedules.startAt,
      })
      .from(trainingEnrollments)
      .innerJoin(trainingSchedules, eq(trainingEnrollments.scheduleId, trainingSchedules.id))
      .innerJoin(trainingPrograms, eq(trainingSchedules.programId, trainingPrograms.id))
      .where(eq(trainingEnrollments.employeeId, employeeId));

    // 5. Identify Missing Mandatory
    const globalMandatory = await this.db.db
      .select({ id: trainingPrograms.id, title: trainingPrograms.title })
      .from(trainingPrograms)
      .where(eq(trainingPrograms.isMandatory, true));

    const posMandatory = employee.positionId ? await this.db.db
      .select({ id: trainingPrograms.id, title: trainingPrograms.title })
      .from(positionMandatoryTrainings)
      .innerJoin(trainingPrograms, eq(positionMandatoryTrainings.programId, trainingPrograms.id))
      .where(eq(positionMandatoryTrainings.positionId, employee.positionId)) : [];

    const allRequired = [...globalMandatory, ...posMandatory];
    const completedProgramIds = new Set(enrollments.filter((e) => e.status === 'COMPLETED').map((e) => e.programId));
    const missingMandatory = allRequired.filter(r => !completedProgramIds.has(r.id));

    // 6. Upcoming Leaves
    const upcomingLeaves = await this.db.db
      .select()
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.employeeId, employeeId),
        gte(leaveRequests.startDate, new Date().toISOString().slice(0, 10)),
        eq(leaveRequests.status, 'APPROVED')
      ))
      .limit(5);

    // 7. Schedule
    const [schedule] = await this.db.db
      .select()
      .from(employeeShiftAssignments)
      .where(eq(employeeShiftAssignments.employeeId, employeeId))
      .limit(1);

    return {
      employee,
      skills: {
        actual: actualSkills,
        required: requirements,
      },
      training: {
        enrollments,
        missingMandatory,
      },
      upcomingLeaves,
      schedule,
    };
  }

  // --- Employee Skills (Profile) ---

  async getEmployeeSkills(employeeId: string): Promise<EmployeeSkillInfo[]> {
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
    const skillIds = results.map((r) => r.id);
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

    return results.map((r) => ({
      ...r,
      endorsements: endorsements.filter((e) => e.employeeSkillId === r.id),
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

    const [inserted] = await this.db.db
      .insert(skillCategories)
      .values({
        name: data.name,
        description: data.description ?? null,
      })
      .returning();

    return inserted;
  }

  async updateCategory(id: string, data: { name?: string; description?: string }) {
    const [updated] = await this.db.db
      .update(skillCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(skillCategories.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Category not found');
    }

    return updated;
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

    const [inserted] = await this.db.db
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

    return inserted;
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
    const [updated] = await this.db.db
      .update(skills)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Skill not found');
    }

    return updated;
  }

  async getTaxonomy(): Promise<TaxonomyCategoryInfo[]> {
    const categories = await this.getAllCategories();
    const allSkills = await this.db.db.select().from(skills).orderBy(asc(skills.name));

    return categories.map((cat) => ({
      ...cat,
      skills: allSkills.filter((s) => s.categoryId === cat.id),
    }));
  }
}

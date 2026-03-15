import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AuditService } from '../audit/audit.service';
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
  orgUnitMandatoryTrainings,
  users,
} from '@hybrid-hris/db/schema';
import { and, eq, asc, sql, isNull, inArray, gte, or, SQL } from 'drizzle-orm';
import {
  EmployeeSkillInfo,
  TalentCardData,
  TaxonomyCategoryInfo,
  TaxonomySkillInfo,
  SkillGapCell,
  SkillGapRow,
  AssignSkillDto,
  DeclareSkillDto,
  ProcessSkillApprovalDto,
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
  CreateSkillDto,
  UpdateSkillDto,
  AddSkillToPositionDto
} from './dto/skills.dto';

@Injectable()
export class SkillsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) { }

  // apps/api/src/core/org-units/org-units.service.ts

  async getEmployeeTalentCard(
    employeeId: string,
    managerEmployeeId: string,
    isHr: boolean = false
  ): Promise<TalentCardData> {
    const whereClauses: (SQL<unknown> | undefined)[] = [
      eq(employees.id, employeeId),
      isNull(employees.deletedAt)
    ];

    if (!isHr) {
      const unitFilter = sql<string>`(
        WITH RECURSIVE downline_units AS (
          SELECT org_unit_id FROM org_unit_leaders WHERE employee_id = ${managerEmployeeId} AND deleted_at IS NULL
          UNION ALL
          SELECT ou.id FROM org_units ou INNER JOIN downline_units d ON ou.parent_id = d.org_unit_id
        )
        SELECT org_unit_id FROM downline_units
      )`;

      whereClauses.push(or(
        eq(employees.supervisorId, managerEmployeeId),
        inArray(employees.orgUnitId, unitFilter)
      ));
    }

    const [employee] = await this.db.db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeNo: employees.employeeNo,
        positionId: employees.positionId,
        positionTitle: positions.title,
        orgUnitId: employees.orgUnitId,
        orgUnitName: orgUnits.name,
        email: users.email,
        supervisorId: employees.supervisorId,
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
      .leftJoin(users, eq(employees.id, users.employeeId))
      .where(and(...whereClauses))
      .limit(1);

    if (!employee) throw new UnauthorizedException('You do not have access to this employee profile');

    // FIX 1: Use explicit return types for the queries to avoid 'any'
    const [
      actualSkills,
      requirements,
      enrollments,
      allRequired,
      upcomingLeaves,
      schedules
    ] = await Promise.all([
      this.getEmployeeSkills(employeeId),

      employee.positionId ? this.db.db
        .select({
          skillId: skills.id,
          skillName: skills.name,
          requiredLevel: positionSkills.requiredProficiencyLevel,
        })
        .from(positionSkills)
        .innerJoin(skills, eq(positionSkills.skillId, skills.id))
        .where(eq(positionSkills.positionId, employee.positionId)) : Promise.resolve([]),

      this.db.db
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
        .where(eq(trainingEnrollments.employeeId, employeeId)),

      this.db.db
        .selectDistinct({ id: trainingPrograms.id, title: trainingPrograms.title })
        .from(trainingPrograms)
        .leftJoin(positionMandatoryTrainings, eq(trainingPrograms.id, positionMandatoryTrainings.programId))
        .leftJoin(orgUnitMandatoryTrainings, eq(trainingPrograms.id, orgUnitMandatoryTrainings.programId))
        .where(or(
          eq(trainingPrograms.isMandatory, true),
          employee.positionId ? eq(positionMandatoryTrainings.positionId, employee.positionId) : undefined,
          employee.orgUnitId ? eq(orgUnitMandatoryTrainings.orgUnitId, employee.orgUnitId) : undefined
        )),

      this.db.db
        .select()
        .from(leaveRequests)
        .where(and(
          eq(leaveRequests.employeeId, employeeId),
          gte(leaveRequests.startDate, new Date().toISOString().slice(0, 10)),
          eq(leaveRequests.status, 'APPROVED')
        ))
        .limit(5),

      this.db.db
        .select()
        .from(employeeShiftAssignments)
        .where(eq(employeeShiftAssignments.employeeId, employeeId))
        .limit(1)
    ]);

    // FIX 2: Destructure correctly and handle the Set logic without 'any'
    const schedule = schedules[0] || null;

    const completedProgramIds = new Set(
      enrollments
        .filter(e => e.status === 'COMPLETED')
        .map(e => e.programId)
    );

    const enrolledItems = enrollments.filter(e => e.status === 'ENROLLED');
    const enrolledProgramIds = new Set(enrolledItems.map(e => e.programId));

    // FIX 3: Type the filter predicates
    const missingMandatory = allRequired.filter(r =>
      !completedProgramIds.has(r.id) && !enrolledProgramIds.has(r.id)
    );

    const scheduledMandatory = enrolledItems
      .filter(e => allRequired.some(r => r.id === e.programId))
      .map(e => {
        const program = allRequired.find(r => r.id === e.programId);
        return {
          id: e.programId,
          title: program?.title ?? 'Unknown Program',
          scheduleId: e.id,
          startAt: e.startAt
        };
      });

    return {
      employee,
      skills: {
        actual: actualSkills,
        required: requirements,
      },
      training: {
        enrollments,
        missingMandatory,
        scheduledMandatory,
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

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return results.map((r) => {
      let isExpired = false;
      let isExpiringSoon = false;

      if (r.expiryDate) {
        const expiry = new Date(r.expiryDate);
        isExpired = expiry < now;
        isExpiringSoon = !isExpired && expiry <= thirtyDaysFromNow;
      }

      return {
        ...r,
        isExpired,
        isExpiringSoon,
        endorsements: endorsements.filter((e) => e.employeeSkillId === r.id),
      };
    });
  }

  async declareSkill(employeeId: string, data: DeclareSkillDto, actorId: string) {
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
    
    await this.auditService.log({
        userId: actorId,
        action: 'employee_skill.declare',
        entityType: 'employee_skill',
        entityId: inserted.id,
        newValue: inserted,
    });

    return inserted;
  }

  async removeSkill(employeeId: string, employeeSkillId: string, actorId: string) {
    const [existing] = await this.db.db
        .select()
        .from(employeeSkills)
        .where(and(eq(employeeSkills.id, employeeSkillId), eq(employeeSkills.employeeId, employeeId)))
        .limit(1);

    if (!existing) {
        throw new NotFoundException('Skill declaration not found');
    }

    await this.db.db
      .delete(employeeSkills)
      .where(and(eq(employeeSkills.id, employeeSkillId), eq(employeeSkills.employeeId, employeeId)))
      
    await this.auditService.log({
        userId: actorId,
        action: 'employee_skill.remove',
        entityType: 'employee_skill',
        entityId: employeeSkillId,
        oldValue: existing,
    });

    return { success: true };
  }

  // --- Manager Skill Management ---

  async getTeamSkillGap(
    managerEmployeeId: string,
    options: { recursive?: boolean; search?: string; offset?: number; limit?: number; scope?: string; isHr?: boolean } = {}
  ): Promise<{ skills: { id: string; name: string }[]; grid: SkillGapRow[]; total: number; hasMore: boolean }> {
    const { recursive = false, search = '', offset = 0, limit = 20, scope = 'downline', isHr = false } = options;
    const now = new Date();

    const whereClauses: (SQL<unknown> | undefined)[] = [
      inArray(employees.status, ['ACTIVE', 'PROBATION', 'SUSPENDED']),
      isNull(employees.deletedAt)
    ];

    // 1. Identify target units (recursive if requested)
    if (!(isHr && scope === 'organization')) {
      const unitFilter = sql`(
        WITH RECURSIVE downline_units AS (
          SELECT org_unit_id FROM org_unit_leaders WHERE employee_id = ${managerEmployeeId} AND deleted_at IS NULL
          UNION ALL
          SELECT ou.id FROM org_units ou INNER JOIN downline_units d ON ou.parent_id = d.org_unit_id
          WHERE ${recursive} = true
        )
        SELECT org_unit_id FROM downline_units
      )`;

      whereClauses.push(or(
        inArray(employees.orgUnitId, unitFilter),
        eq(employees.supervisorId, managerEmployeeId)
      ));
    }

    if (search) {
      whereClauses.push(sql`(lower(${employees.firstName}) LIKE lower(${'%' + search + '%'}) OR lower(${employees.lastName}) LIKE lower(${'%' + search + '%'}))`);
    }

    // 3. Get Total Count
    const [countResult] = await this.db.db
      .select({ count: sql<number>`cast(count(${employees.id}) as int)` })
      .from(employees)
      .where(and(...whereClauses));

    const total = countResult?.count ?? 0;

    // 4. Get Paginated Employees
    const myTeam = await this.db.db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        positionId: employees.positionId,
        positionTitle: positions.title,
        orgUnitId: employees.orgUnitId,
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(and(...whereClauses))
      .orderBy(asc(employees.lastName), asc(employees.firstName))
      .limit(limit)
      .offset(offset);

    if (myTeam.length === 0) return { skills: [], grid: [], total, hasMore: false };

    const employeeIds = myTeam.map(e => e.id);
    const positionIds = Array.from(new Set(myTeam.map(e => e.positionId).filter(Boolean)));

    const requirements = positionIds.length > 0 ? await this.db.db
      .select({
        skillId: skills.id,
        skillName: skills.name,
        positionId: positionSkills.positionId,
        requiredLevel: positionSkills.requiredProficiencyLevel,
      })
      .from(positionSkills)
      .innerJoin(skills, eq(positionSkills.skillId, skills.id))
      .where(inArray(positionSkills.positionId, positionIds)) : [];

    const actuals = await this.db.db
      .select({
        employeeId: employeeSkills.employeeId,
        skillId: employeeSkills.skillId,
        proficiencyLevel: employeeSkills.proficiencyLevel,
        status: employeeSkills.verificationStatus,
        expiryDate: employeeSkills.expiryDate,
      })
      .from(employeeSkills)
      .where(and(
        inArray(employeeSkills.employeeId, employeeIds),
        eq(employeeSkills.verificationStatus, 'VERIFIED')
      ));

    // Union of all skills required by the team
    const uniqueSkillMap = new Map<string, string>();
    requirements.forEach(r => uniqueSkillMap.set(r.skillId, r.skillName));
    const headerSkills = Array.from(uniqueSkillMap.entries()).map(([id, name]) => ({ id, name }));

    const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

    const grid = myTeam.map(emp => {
      const empReqs = requirements.filter(r => r.positionId === emp.positionId);
      const empSkills = actuals.filter(a => a.employeeId === emp.id);

      const skillCells: SkillGapCell[] = headerSkills.map(s => {
        const req = empReqs.find(r => r.skillId === s.id);
        const actual = empSkills.find(a => a.skillId === s.id);

        if (!req) return { skillId: s.id, status: 'NA' };

        // Handle Missing or Expired
        const isExpired = actual?.expiryDate ? new Date(actual.expiryDate) < now : false;
        if (!actual || isExpired) return { skillId: s.id, status: 'MISSING', target: req.requiredLevel };

        const actualIdx = levels.indexOf(actual.proficiencyLevel);
        const targetIdx = levels.indexOf(req.requiredLevel);

        return {
          skillId: s.id,
          status: actualIdx >= targetIdx ? 'MET' : 'BELOW',
          actual: actual.proficiencyLevel,
          target: req.requiredLevel
        };
      });

      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        positionTitle: emp.positionTitle,
        cells: skillCells
      };
    });

    return {
      skills: headerSkills,
      grid,
      total,
      hasMore: offset + limit < total
    };
  }

  async assignSkillToReport(
    managerEmployeeId: string,
    data: AssignSkillDto,
    actorId: string,
    isHr: boolean = false
  ) {
    // 1. Verify access
    if (!isHr) {
      const [report] = await this.db.db
        .select({ id: employees.id })
        .from(employees)
        .where(and(eq(employees.id, data.employeeId), eq(employees.supervisorId, managerEmployeeId)))
        .limit(1);

      if (!report) throw new UnauthorizedException('Target employee is not your direct report');
    }

    const [existing] = await this.db.db.select().from(employeeSkills).where(and(eq(employeeSkills.employeeId, data.employeeId), eq(employeeSkills.skillId, data.skillId))).limit(1);

    // 2. Upsert as VERIFIED
    const [inserted] = await this.db.db
      .insert(employeeSkills)
      .values({
        employeeId: data.employeeId,
        skillId: data.skillId,
        proficiencyLevel: data.proficiencyLevel,
        source: 'MANAGER_ASSIGNED',
        verificationStatus: 'VERIFIED',
        acquiredDate: sql`CURRENT_DATE`,
        verifiedById: managerEmployeeId,
        verifiedAt: new Date(),
        notes: data.notes ?? null,
      })
      .onConflictDoUpdate({
        target: [employeeSkills.employeeId, employeeSkills.skillId],
        set: {
          proficiencyLevel: data.proficiencyLevel,
          verificationStatus: 'VERIFIED',
          source: 'MANAGER_ASSIGNED',
          verifiedById: managerEmployeeId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
          notes: data.notes ?? null,
        }
      })
      .returning();
    
    await this.auditService.log({
        userId: actorId,
        action: existing ? 'employee_skill.assign_update' : 'employee_skill.assign_create',
        entityType: 'employee_skill',
        entityId: inserted.id,
        oldValue: existing,
        newValue: inserted,
    });

    return inserted;
  }

  // --- Manager Skill Approvals ---

  async getPendingSkillsForManager(managerEmployeeId: string, isHr: boolean = false) {
    const whereClauses: (SQL<unknown> | undefined)[] = [
      eq(employeeSkills.verificationStatus, 'PENDING'),
      isNull(employees.deletedAt)
    ];

    if (!isHr) {
      whereClauses.push(eq(employees.supervisorId, managerEmployeeId));
    }

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
      .where(and(...whereClauses))
      .orderBy(asc(employeeSkills.createdAt));
  }

  async processSkillApproval(
    employeeSkillId: string,
    managerEmployeeId: string,
    data: ProcessSkillApprovalDto,
    actorId: string,
    isHr: boolean = false
  ) {
    // 1. Verify this is a pending skill for a direct report (if not HR)
    const whereClauses: (SQL<unknown> | undefined)[] = [
      eq(employeeSkills.id, employeeSkillId),
      eq(employeeSkills.verificationStatus, 'PENDING')
    ];

    if (!isHr) {
      whereClauses.push(eq(employees.supervisorId, managerEmployeeId));
    }

    const [existing] = await this.db.db
      .select()
      .from(employeeSkills)
      .innerJoin(employees, eq(employeeSkills.employeeId, employees.id))
      .where(and(...whereClauses))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Pending skill declaration not found');
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
    
    await this.auditService.log({
        userId: actorId,
        action: data.status === 'VERIFIED' ? 'employee_skill.approve' : 'employee_skill.reject',
        entityType: 'employee_skill',
        entityId: employeeSkillId,
        oldValue: existing.employee_skills,
        newValue: updated,
    });

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

  async createCategory(data: CreateSkillCategoryDto, actorId: string) {
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

    await this.auditService.log({
        userId: actorId,
        action: 'skill_category.create',
        entityType: 'skill_category',
        entityId: inserted.id,
        newValue: inserted,
    });

    return inserted;
  }

  async updateCategory(id: string, data: UpdateSkillCategoryDto, actorId: string) {
    const [existing] = await this.db.db.select().from(skillCategories).where(eq(skillCategories.id, id)).limit(1);
    if (!existing) {
        throw new NotFoundException('Category not found');
    }

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
    
    await this.auditService.log({
        userId: actorId,
        action: 'skill_category.update',
        entityType: 'skill_category',
        entityId: id,
        oldValue: existing,
        newValue: updated,
    });

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

  async createSkill(data: CreateSkillDto, actorId?: string) {
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

    if (actorId && inserted) {
      await this.auditService.log({
        userId: actorId,
        action: 'CREATE',
        entityType: 'SKILL',
        entityId: inserted.id,
        newValue: inserted,
      });
    }

    return inserted;
  }

  async updateSkill(
    id: string,
    data: UpdateSkillDto,
    actorId?: string,
  ) {
    const existing = await this.db.db
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);

    if (!existing.length) {
      throw new NotFoundException('Skill not found');
    }

    const [updated] = await this.db.db
      .update(skills)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id))
      .returning();

    if (actorId && updated) {
      await this.auditService.log({
        userId: actorId,
        action: 'UPDATE',
        entityType: 'SKILL',
        entityId: id,
        oldValue: existing[0],
        newValue: updated,
      });
    }

    return updated;
  }

  async getTaxonomy(): Promise<TaxonomyCategoryInfo[]> {
    const categories = await this.getAllCategories();
    const allSkills = await this.db.db.select().from(skills).orderBy(asc(skills.name));

    return categories.map((cat) => ({
      ...cat,
      skills: allSkills.filter((s) => s.categoryId === cat.id) as TaxonomySkillInfo[],
    })) as TaxonomyCategoryInfo[];
  }

  // --- Position Skills (Role Competencies) ---

  async getPositionSkills(positionId: string) {
    return this.db.db
      .select({
        id: positionSkills.id,
        skillId: skills.id,
        skillName: skills.name,
        skillType: skills.type,
        requiredProficiencyLevel: positionSkills.requiredProficiencyLevel,
      })
      .from(positionSkills)
      .innerJoin(skills, eq(positionSkills.skillId, skills.id))
      .where(eq(positionSkills.positionId, positionId))
      .orderBy(asc(skills.name));
  }

  async addSkillToPosition(data: AddSkillToPositionDto, actorId: string) {
    const [existing] = await this.db.db.select().from(positionSkills).where(and(eq(positionSkills.positionId, data.positionId), eq(positionSkills.skillId, data.skillId))).limit(1);

    const [inserted] = await this.db.db
      .insert(positionSkills)
      .values({
        positionId: data.positionId,
        skillId: data.skillId,
        requiredProficiencyLevel: data.requiredProficiencyLevel,
      })
      .onConflictDoUpdate({
        target: [positionSkills.positionId, positionSkills.skillId],
        set: { requiredProficiencyLevel: data.requiredProficiencyLevel, updatedAt: new Date() },
      })
      .returning();

    await this.auditService.log({
        userId: actorId,
        action: existing ? 'position_skill.update' : 'position_skill.create',
        entityType: 'position_skill',
        entityId: `${data.positionId}:${data.skillId}`,
        oldValue: existing,
        newValue: inserted,
    });

    return inserted;
  }

  async removeSkillFromPosition(positionId: string, skillId: string, actorId: string) {
    const [existing] = await this.db.db.select().from(positionSkills).where(and(eq(positionSkills.positionId, positionId), eq(positionSkills.skillId, skillId))).limit(1);
    if (!existing) {
        throw new NotFoundException('Position skill not found');
    }

    await this.db.db
      .delete(positionSkills)
      .where(and(eq(positionSkills.positionId, positionId), eq(positionSkills.skillId, skillId)));
    
    await this.auditService.log({
        userId: actorId,
        action: 'position_skill.delete',
        entityType: 'position_skill',
        entityId: `${positionId}:${skillId}`,
        oldValue: existing,
    });

    return { success: true };
  }
}

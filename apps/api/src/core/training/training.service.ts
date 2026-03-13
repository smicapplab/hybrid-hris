import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  trainingPrograms,
  trainingProgramSkills,
  trainingPrerequisites,
  trainingSchedules,
  trainingScheduleSessions,
  trainingEnrollments,
  skills,
  employees,
  orgUnits,
  positions,
  employeeSkills,
  positionMandatoryTrainings,
  orgUnitMandatoryTrainings,
} from '@hybrid-hris/db/schema';
import { eq, and, asc, sql, count, inArray, isNull, or, SQL } from 'drizzle-orm';
import { TrainingEnrollmentStatus } from '@hybrid-hris/domain';
import { Tx } from 'src/database/database.types';
import { 
  TeamComplianceInfo, 
  MyTrainingInfo, 
  AttendeeInfo,
  CreateTrainingProgramDto,
  UpdateTrainingProgramDto,
  CreateTrainingScheduleDto,
  UpdateTrainingScheduleDto,
  UpdateAttendeeStatusDto,
} from './dto/training.dto';

@Injectable()
export class TrainingService {
  constructor(private readonly db: DatabaseService) {}

  async getTeamCompliance(
    managerEmployeeId: string,
    options: { recursive?: boolean; search?: string; offset?: number; limit?: number; scope?: string; isHr?: boolean } = {}
  ): Promise<{ data: TeamComplianceInfo[]; total: number; hasMore: boolean }> {
    const { recursive = false, search = '', offset = 0, limit = 20, scope = 'downline', isHr = false } = options;

    const whereClauses: (SQL<unknown> | undefined)[] = [
      inArray(employees.status, ['ACTIVE', 'PROBATION', 'SUSPENDED']),
      isNull(employees.deletedAt)
    ];

    // Only enforce downline filter if not HR_ADMIN requesting organization scope
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

    const [countResult] = await this.db.db
      .select({ count: sql<number>`cast(count(${employees.id}) as int)` })
      .from(employees)
      .where(and(...whereClauses));

    const total = countResult?.count ?? 0;

    const myTeam = await this.db.db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeNo: employees.employeeNo,
        positionId: employees.positionId,
        orgUnitId: employees.orgUnitId,
        positionTitle: positions.title,
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(and(...whereClauses))
      .orderBy(asc(employees.lastName), asc(employees.firstName))
      .limit(limit)
      .offset(offset);

    if (myTeam.length === 0) return { data: [], total, hasMore: false };

    const employeeIds = myTeam.map(e => e.id);
    const positionIds = Array.from(new Set(myTeam.map(e => e.positionId).filter(Boolean)));
    const orgUnitIds = Array.from(new Set(myTeam.map(e => e.orgUnitId).filter(Boolean)));

    const globalMandatory = await this.db.db
      .select({ id: trainingPrograms.id, title: trainingPrograms.title })
      .from(trainingPrograms)
      .where(eq(trainingPrograms.isMandatory, true));

    const positionMandatory = positionIds.length > 0 ? await this.db.db
      .select({ 
        positionId: positionMandatoryTrainings.positionId, 
        programId: trainingPrograms.id,
        title: trainingPrograms.title
      })
      .from(positionMandatoryTrainings)
      .innerJoin(trainingPrograms, eq(positionMandatoryTrainings.programId, trainingPrograms.id))
      .where(inArray(positionMandatoryTrainings.positionId, positionIds)) : [];

    const orgMandatory = orgUnitIds.length > 0 ? await this.db.db
      .select({
        orgUnitId: orgUnitMandatoryTrainings.orgUnitId,
        programId: trainingPrograms.id,
        title: trainingPrograms.title
      })
      .from(orgUnitMandatoryTrainings)
      .innerJoin(trainingPrograms, eq(orgUnitMandatoryTrainings.programId, trainingPrograms.id))
      .where(inArray(orgUnitMandatoryTrainings.orgUnitId, orgUnitIds)) : [];

    const enrollments = await this.db.db
      .select({ 
        employeeId: trainingEnrollments.employeeId, 
        programId: trainingPrograms.id,
        status: trainingEnrollments.status,
        scheduleId: trainingSchedules.id,
        startAt: trainingSchedules.startAt
      })
      .from(trainingEnrollments)
      .innerJoin(trainingSchedules, eq(trainingEnrollments.scheduleId, trainingSchedules.id))
      .innerJoin(trainingPrograms, eq(trainingSchedules.programId, trainingPrograms.id))
      .where(and(
        inArray(trainingEnrollments.employeeId, employeeIds),
        inArray(trainingEnrollments.status, ['COMPLETED', 'ENROLLED'])
      ));

    const data = myTeam.map(emp => {
      const rawRequired = [
        ...globalMandatory.map(p => ({ id: p.id, title: p.title })),
        ...positionMandatory.filter(pm => pm.positionId === emp.positionId).map(p => ({ id: p.programId, title: p.title })),
        ...orgMandatory.filter(om => om.orgUnitId === emp.orgUnitId).map(p => ({ id: p.programId, title: p.title }))
      ];
      
      const requiredMap = new Map<string, { id: string; title: string }>();
      rawRequired.forEach(r => requiredMap.set(r.id, r));
      const required = Array.from(requiredMap.values());
      
      const empEnrollments = enrollments.filter(c => c.employeeId === emp.id);
      const finishedIds = new Set(empEnrollments.filter(e => e.status === 'COMPLETED').map(c => c.programId));
      const enrolledItems = empEnrollments.filter(e => e.status === 'ENROLLED');
      const enrolledIds = new Set(enrolledItems.map(e => e.programId));

      const missing = required.filter(r => !finishedIds.has(r.id) && !enrolledIds.has(r.id));
      const scheduled = enrolledItems
        .filter(e => requiredMap.has(e.programId))
        .map(e => ({
          id: e.programId,
          title: requiredMap.get(e.programId)!.title,
          scheduleId: e.scheduleId,
          startAt: e.startAt
        }));

      return {
        ...emp,
        requiredCount: required.length,
        completedCount: finishedIds.size,
        missingMandatory: missing,
        scheduledMandatory: scheduled,
        isCompliant: missing.length === 0
      };
    });

    return {
      data,
      total,
      hasMore: offset + limit < total
    };
  }

  async getPublicScheduleDetails(scheduleId: string, currentEmployeeId?: string) {
    const result = await this.db.db
      .select({
        schedule: trainingSchedules,
        program: trainingPrograms,
      })
      .from(trainingSchedules)
      .innerJoin(trainingPrograms, eq(trainingSchedules.programId, trainingPrograms.id))
      .where(eq(trainingSchedules.id, scheduleId))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('Schedule not found');
    }

    const { schedule, program } = result[0];

    const sessions = await this.db.db
      .select()
      .from(trainingScheduleSessions)
      .where(eq(trainingScheduleSessions.scheduleId, scheduleId))
      .orderBy(asc(trainingScheduleSessions.startAt));

    const [enrollmentCount] = await this.db.db
      .select({ val: count() })
      .from(trainingEnrollments)
      .where(
        and(
          eq(trainingEnrollments.scheduleId, scheduleId),
          eq(trainingEnrollments.status, 'ENROLLED' as TrainingEnrollmentStatus)
        )
      );

    let myEnrollment = null;
    if (currentEmployeeId) {
      const [enrollment] = await this.db.db
        .select()
        .from(trainingEnrollments)
        .where(
          and(
            eq(trainingEnrollments.scheduleId, scheduleId),
            eq(trainingEnrollments.employeeId, currentEmployeeId)
          )
        )
        .limit(1);
      myEnrollment = enrollment || null;
    }

    const attendees = await this.db.db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        orgUnitName: orgUnits.name,
      })
      .from(trainingEnrollments)
      .innerJoin(employees, eq(trainingEnrollments.employeeId, employees.id))
      .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
      .where(
        and(
          eq(trainingEnrollments.scheduleId, scheduleId),
          eq(trainingEnrollments.status, 'ENROLLED' as TrainingEnrollmentStatus)
        )
      );

    return {
      ...schedule,
      program,
      sessions,
      attendeeCount: Number(enrollmentCount.val),
      myEnrollment,
      attendees,
    };
  }

  async enroll(scheduleId: string, employeeId: string) {
    const schedule = await this.db.db
      .select()
      .from(trainingSchedules)
      .where(eq(trainingSchedules.id, scheduleId))
      .limit(1);

    if (!schedule.length) throw new NotFoundException('Schedule not found');
    if (schedule[0].status !== 'SCHEDULED') throw new ConflictException('This session is no longer open for enrollment');

    if (schedule[0].capacity) {
      const [current] = await this.db.db
        .select({ val: count() })
        .from(trainingEnrollments)
        .where(
          and(
            eq(trainingEnrollments.scheduleId, scheduleId),
            eq(trainingEnrollments.status, 'ENROLLED')
          )
        );
      
      if (Number(current.val) >= schedule[0].capacity) {
        throw new ConflictException('This session is at full capacity');
      }
    }

    const existing = await this.db.db
      .select()
      .from(trainingEnrollments)
      .where(
        and(
          eq(trainingEnrollments.scheduleId, scheduleId),
          eq(trainingEnrollments.employeeId, employeeId)
        )
      )
      .limit(1);

    if (existing.length) {
      if (existing[0].status === 'CANCELLED') {
        return (await this.db.db
          .update(trainingEnrollments)
          .set({ status: 'ENROLLED', enrolledAt: new Date(), updatedAt: new Date() })
          .where(eq(trainingEnrollments.id, existing[0].id))
          .returning())[0];
      }
      throw new ConflictException('You are already enrolled in this session');
    }

    const [inserted] = await this.db.db
      .insert(trainingEnrollments)
      .values({
        scheduleId,
        employeeId,
        status: 'ENROLLED',
      })
      .returning();

    return inserted;
  }

  async enrollOrgUnit(scheduleId: string, orgUnitId: string, processorId: string | null) {
    // 1. Security Check: If processor is not an admin, they must have authority over the target org unit
    if (processorId) {
        const unitFilter = sql`(
            WITH RECURSIVE downline_units AS (
                SELECT org_unit_id FROM org_unit_leaders WHERE employee_id = ${processorId} AND deleted_at IS NULL
                UNION ALL
                SELECT ou.id FROM org_units ou INNER JOIN downline_units d ON ou.parent_id = d.org_unit_id
            )
            SELECT org_unit_id FROM downline_units
        )`;

        const authorityCheck = await this.db.db.execute(sql`
            SELECT 1 FROM (SELECT org_unit_id FROM ${unitFilter} t) q WHERE org_unit_id = ${orgUnitId}
        `);

        if (authorityCheck.rows.length === 0) {
            throw new UnauthorizedException('You do not have authority over this organizational unit');
        }
    }

    return await this.db.db.transaction(async (tx) => {
      const orgTree = await tx.execute(sql`
        WITH RECURSIVE org_tree AS (
          SELECT id FROM org_units WHERE id = ${orgUnitId}
          UNION ALL
          SELECT ou.id FROM org_units ou JOIN org_tree ot ON ou.parent_id = ot.id
        )
        SELECT id FROM org_tree
      `);
      
      const orgUnitIds = (orgTree.rows as { id: string }[]).map(row => row.id);
      if (!orgUnitIds.length) return { count: 0 };

      const targetEmployees = await tx
        .select({ id: employees.id })
        .from(employees)
        .where(and(
          inArray(employees.orgUnitId, orgUnitIds),
          isNull(employees.deletedAt),
          inArray(employees.status, ['ACTIVE', 'PROBATION'])
        ));

      if (!targetEmployees.length) return { count: 0 };

      const existingEnrollments = await tx
        .select({ employeeId: trainingEnrollments.employeeId })
        .from(trainingEnrollments)
        .where(eq(trainingEnrollments.scheduleId, scheduleId));
      
      const existingIds = new Set(existingEnrollments.map(e => e.employeeId));
      const toEnroll = targetEmployees.filter(e => !existingIds.has(e.id));

      if (!toEnroll.length) return { count: 0 };

      await tx.insert(trainingEnrollments).values(
        toEnroll.map(e => ({
          scheduleId,
          employeeId: e.id,
          status: 'ENROLLED' as TrainingEnrollmentStatus,
          processedById: processorId,
        }))
      );

      return { count: toEnroll.length };
    });
  }

  async cancelEnrollment(scheduleId: string, employeeId: string) {
    const updated = await this.db.db
      .update(trainingEnrollments)
      .set({ 
        status: 'CANCELLED',
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(trainingEnrollments.scheduleId, scheduleId),
          eq(trainingEnrollments.employeeId, employeeId),
          eq(trainingEnrollments.status, 'ENROLLED')
        )
      )
      .returning();

    if (!updated.length) {
      throw new NotFoundException('Active enrollment not found');
    }

    return updated[0];
  }

  async getMyTrainings(employeeId: string): Promise<MyTrainingInfo[]> {
    const enrollments = await this.db.db
      .select({
        enrollment: trainingEnrollments,
        schedule: trainingSchedules,
        program: trainingPrograms,
      })
      .from(trainingEnrollments)
      .innerJoin(trainingSchedules, eq(trainingEnrollments.scheduleId, trainingSchedules.id))
      .innerJoin(trainingPrograms, eq(trainingSchedules.programId, trainingPrograms.id))
      .where(eq(trainingEnrollments.employeeId, employeeId))
      .orderBy(asc(trainingSchedules.startAt));

    return enrollments.map((e) => ({
      ...e.schedule,
      enrollmentStatus: e.enrollment.status,
      programTitle: e.program.title,
      programType: e.program.type,
      isMandatory: e.program.isMandatory,
    }));
  }

  // --- Training Programs (Templates) ---

  async getAllPrograms() {
    return this.db.db
      .select()
      .from(trainingPrograms)
      .orderBy(asc(trainingPrograms.title));
  }

  async getProgramById(id: string) {
    const program = await this.db.db
      .select()
      .from(trainingPrograms)
      .where(eq(trainingPrograms.id, id))
      .limit(1);

    if (!program.length) {
      throw new NotFoundException('Training program not found');
    }

    const programSkills = await this.db.db
      .select({
        id: trainingProgramSkills.id,
        skillId: skills.id,
        skillName: skills.name,
        grantedProficiencyLevel: trainingProgramSkills.grantedProficiencyLevel,
      })
      .from(trainingProgramSkills)
      .innerJoin(skills, eq(trainingProgramSkills.skillId, skills.id))
      .where(eq(trainingProgramSkills.programId, id));

    const prerequisites = await this.db.db
      .select({
        id: trainingPrerequisites.id,
        prerequisiteProgramId: trainingPrograms.id,
        title: trainingPrograms.title,
      })
      .from(trainingPrerequisites)
      .innerJoin(
        trainingPrograms,
        eq(trainingPrerequisites.prerequisiteProgramId, trainingPrograms.id),
      )
      .where(eq(trainingPrerequisites.programId, id));

    return {
      ...program[0],
      skills: programSkills,
      prerequisites,
    };
  }

  async createProgram(data: CreateTrainingProgramDto) {
    const { skillIds, prerequisiteIds, ...programData } = data;

    return await this.db.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(trainingPrograms)
        .values({
          ...programData,
          isMandatory: programData.isMandatory ?? false,
        })
        .returning();

      if (skillIds?.length) {
        await tx.insert(trainingProgramSkills).values(
          skillIds.map((s) => ({
            programId: inserted.id,
            skillId: s.id,
            grantedProficiencyLevel: s.level,
          })),
        );
      }

      if (prerequisiteIds?.length) {
        await tx.insert(trainingPrerequisites).values(
          prerequisiteIds.map((pid) => ({
            programId: inserted.id,
            prerequisiteProgramId: pid,
          })),
        );
      }

      return inserted;
    });
  }

  async updateProgram(
    id: string,
    data: UpdateTrainingProgramDto
  ) {
    const { skillIds, prerequisiteIds, ...programData } = data;

    return await this.db.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(trainingPrograms)
        .set({
          ...programData,
          updatedAt: new Date(),
        })
        .where(eq(trainingPrograms.id, id))
        .returning();

      if (!updated) {
        throw new NotFoundException('Training program not found');
      }

      if (skillIds !== undefined) {
        await tx.delete(trainingProgramSkills).where(eq(trainingProgramSkills.programId, id));
        if (skillIds.length > 0) {
          await tx.insert(trainingProgramSkills).values(
            skillIds.map((s) => ({
              programId: id,
              skillId: s.id,
              grantedProficiencyLevel: s.level,
            })),
          );
        }
      }

      if (prerequisiteIds !== undefined) {
        await tx.delete(trainingPrerequisites).where(eq(trainingPrerequisites.programId, id));
        if (prerequisiteIds.length > 0) {
          await tx.insert(trainingPrerequisites).values(
            prerequisiteIds.map((pid) => ({
              programId: id,
              prerequisiteProgramId: pid,
            })),
          );
        }
      }

      return updated;
    });
  }

  // --- Training Schedules (Instances) ---

  async getSchedulesByProgram(programId: string) {
    return this.db.db
      .select()
      .from(trainingSchedules)
      .where(eq(trainingSchedules.programId, programId))
      .orderBy(asc(trainingSchedules.startAt));
  }

  async createSchedule(data: CreateTrainingScheduleDto) {
    const { sessions, ...scheduleData } = data;

    return await this.db.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(trainingSchedules)
        .values({
          ...scheduleData,
          startAt: new Date(scheduleData.startAt),
          endAt: new Date(scheduleData.endAt),
          status: scheduleData.status ?? 'SCHEDULED',
        })
        .returning();

      if (sessions?.length) {
        await tx.insert(trainingScheduleSessions).values(
          sessions.map((s) => ({
            scheduleId: inserted.id,
            ...s,
            startAt: new Date(s.startAt),
            endAt: new Date(s.endAt),
          })),
        );
      }

      return inserted;
    });
  }

  async updateSchedule(
    id: string,
    data: UpdateTrainingScheduleDto
  ) {
    const { sessions, ...scheduleData } = data;

    return await this.db.db.transaction(async (tx) => {
      const { startAt, endAt, ...rest } = scheduleData;
      const patch: Partial<typeof trainingSchedules.$inferInsert> = { 
        ...rest, 
        updatedAt: new Date(),
      };
      if (startAt) patch.startAt = new Date(startAt);
      if (endAt) patch.endAt = new Date(endAt);

      const [updated] = await tx
        .update(trainingSchedules)
        .set(patch)
        .where(eq(trainingSchedules.id, id))
        .returning();

      if (!updated) {
        throw new NotFoundException('Schedule not found');
      }

      if (sessions !== undefined) {
        await tx.delete(trainingScheduleSessions).where(eq(trainingScheduleSessions.scheduleId, id));
        if (sessions.length > 0) {
          await tx.insert(trainingScheduleSessions).values(
            sessions.map((s) => ({
              scheduleId: id,
              ...s,
              startAt: new Date(s.startAt),
              endAt: new Date(s.endAt),
            })),
          );
        }
      }

      return updated;
    });
  }

  async getUpcomingSchedules() {
    return this.db.db
      .select({
        id: trainingSchedules.id,
        programId: trainingSchedules.programId,
        programTitle: trainingPrograms.title,
        location: trainingSchedules.location,
        startAt: trainingSchedules.startAt,
        endAt: trainingSchedules.endAt,
        status: trainingSchedules.status,
        capacity: trainingSchedules.capacity,
      })
      .from(trainingSchedules)
      .innerJoin(trainingPrograms, eq(trainingSchedules.programId, trainingPrograms.id))
      .where(sql`${trainingSchedules.startAt} >= CURRENT_TIMESTAMP`)
      .orderBy(asc(trainingSchedules.startAt));
  }

  async getScheduleWithSessions(id: string) {
    const schedule = await this.db.db
      .select()
      .from(trainingSchedules)
      .where(eq(trainingSchedules.id, id))
      .limit(1);

    if (!schedule.length) {
      throw new NotFoundException('Schedule not found');
    }

    const sessions = await this.db.db
      .select()
      .from(trainingScheduleSessions)
      .where(eq(trainingScheduleSessions.scheduleId, id))
      .orderBy(asc(trainingScheduleSessions.startAt));

    return {
      ...schedule[0],
      sessions,
    };
  }

  // --- Attendee Management ---

  async getScheduleAttendees(scheduleId: string): Promise<AttendeeInfo[]> {
    return this.db.db
      .select({
        enrollmentId: trainingEnrollments.id,
        employeeId: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeNo: employees.employeeNo,
        orgUnitName: orgUnits.name,
        status: trainingEnrollments.status,
        processedAt: trainingEnrollments.processedAt,
      })
      .from(trainingEnrollments)
      .innerJoin(employees, eq(trainingEnrollments.employeeId, employees.id))
      .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
      .where(eq(trainingEnrollments.scheduleId, scheduleId))
      .orderBy(asc(employees.lastName));
  }

  async updateAttendeeStatus(
    enrollmentId: string,
    data: UpdateAttendeeStatusDto,
    processorId: string | null,
    tx?: Tx
  ) {
    const db = tx || this.db.db;

    const [enrollment] = await db
      .update(trainingEnrollments)
      .set({
        status: data.status,
        completionNotes: data.notes ?? null,
        processedAt: new Date(),
        processedById: processorId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(trainingEnrollments.id, enrollmentId))
      .returning();

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (data.status === 'COMPLETED') {
      const results = await db
        .select({
          programId: trainingPrograms.id,
          skillId: trainingProgramSkills.skillId,
          grantedProficiencyLevel: trainingProgramSkills.grantedProficiencyLevel,
        })
        .from(trainingSchedules)
        .innerJoin(trainingPrograms, eq(trainingSchedules.programId, trainingPrograms.id))
        .innerJoin(trainingProgramSkills, eq(trainingPrograms.id, trainingProgramSkills.programId))
        .where(eq(trainingSchedules.id, enrollment.scheduleId));

      for (const ps of results) {
        await db
          .insert(employeeSkills)
          .values({
            employeeId: enrollment.employeeId,
            skillId: ps.skillId,
            trainingEnrollmentId: enrollment.id,
            proficiencyLevel: ps.grantedProficiencyLevel,
            source: 'INTERNAL_TRAINING',
            verificationStatus: 'VERIFIED',
            acquiredDate: sql`CURRENT_DATE`,
            verifiedById: processorId ?? null,
            verifiedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [employeeSkills.employeeId, employeeSkills.skillId],
            set: {
              proficiencyLevel: ps.grantedProficiencyLevel,
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              updatedAt: new Date(),
              trainingEnrollmentId: enrollment.id,
            },
          });
      }
    }

    return enrollment;
  }

  async bulkUpdateAttendeeStatus(
    enrollmentIds: string[],
    data: UpdateAttendeeStatusDto,
    processorId: string | null
  ) {
    return await this.db.db.transaction(async (tx) => {
      return await Promise.all(
        enrollmentIds.map(id => this.updateAttendeeStatus(id, data, processorId, tx))
      );
    });
  }

  async addAttendee(scheduleId: string, employeeId: string, processorId: string | null) {
    // 1. Security Check: If processor is not an admin, they must have downline authority
    if (processorId) {
        const unitFilter = sql`(
            WITH RECURSIVE downline_units AS (
                SELECT org_unit_id FROM org_unit_leaders WHERE employee_id = ${processorId} AND deleted_at IS NULL
                UNION ALL
                SELECT ou.id FROM org_units ou INNER JOIN downline_units d ON ou.parent_id = d.org_unit_id
            )
            SELECT org_unit_id FROM downline_units
        )`;

        const [targetEmployee] = await this.db.db
            .select({ id: employees.id })
            .from(employees)
            .where(and(
                eq(employees.id, employeeId),
                isNull(employees.deletedAt),
                or(
                    eq(employees.supervisorId, processorId),
                    inArray(employees.orgUnitId, unitFilter)
                )
            ))
            .limit(1);

        if (!targetEmployee) {
            throw new UnauthorizedException('You do not have authority to enroll this employee');
        }
    }

    // 2. Check if already enrolled
    const existing = await this.db.db
      .select({ id: trainingEnrollments.id })
      .from(trainingEnrollments)
      .where(and(
        eq(trainingEnrollments.scheduleId, scheduleId),
        eq(trainingEnrollments.employeeId, employeeId)
      ))
      .limit(1);

    if (existing.length) {
      throw new ConflictException('Employee is already enrolled in this session');
    }

    const [inserted] = await this.db.db
      .insert(trainingEnrollments)
      .values({
        scheduleId,
        employeeId,
        status: 'ENROLLED',
        processedById: processorId ?? null,
      })
      .returning();
    return inserted;
  }

  async removeAttendee(enrollmentId: string) {
    const [deleted] = await this.db.db
      .delete(trainingEnrollments)
      .where(eq(trainingEnrollments.id, enrollmentId))
      .returning();
    
    if (!deleted) throw new NotFoundException('Enrollment not found');
    
    await this.db.db
      .delete(employeeSkills)
      .where(eq(employeeSkills.trainingEnrollmentId, enrollmentId));

    return deleted;
  }

  async bulkRemoveAttendees(enrollmentIds: string[]) {
    return await this.db.db.transaction(async (tx) => {
      await tx
        .delete(employeeSkills)
        .where(inArray(employeeSkills.trainingEnrollmentId, enrollmentIds));

      const deleted = await tx
        .delete(trainingEnrollments)
        .where(inArray(trainingEnrollments.id, enrollmentIds))
        .returning();

      return deleted;
    });
  }

  async enrollAllEligible(scheduleId: string, processorId: string | null) {
    // 1. Get Program context via Schedule
    const [row] = await this.db.db
      .select({
        program: trainingPrograms,
      })
      .from(trainingSchedules)
      .innerJoin(trainingPrograms, eq(trainingSchedules.programId, trainingPrograms.id))
      .where(eq(trainingSchedules.id, scheduleId))
      .limit(1);

    if (!row) throw new NotFoundException('Schedule not found');
    const { program } = row;

    // 2. Identify target groups
    const posTargets = await this.db.db
      .select({ id: positionMandatoryTrainings.positionId })
      .from(positionMandatoryTrainings)
      .where(eq(positionMandatoryTrainings.programId, program.id));
    
    const orgTargets = await this.db.db
      .select({ id: orgUnitMandatoryTrainings.orgUnitId })
      .from(orgUnitMandatoryTrainings)
      .where(eq(orgUnitMandatoryTrainings.programId, program.id));

    const targetPosIds = posTargets.map(t => t.id);
    const targetOrgIds = orgTargets.map(t => t.id);

    // 3. Find all employees who NEED this training
    // (Global OR matched Position OR matched Org Unit)
    const targetConditions: (SQL<unknown> | undefined)[] = [
        isNull(employees.deletedAt),
        inArray(employees.status, ['ACTIVE', 'PROBATION'])
    ];

    // If processor is not admin, they can ONLY enroll their downline
    if (processorId) {
        const authorityFilter = sql`(
            WITH RECURSIVE downline_units AS (
                SELECT org_unit_id FROM org_unit_leaders WHERE employee_id = ${processorId} AND deleted_at IS NULL
                UNION ALL
                SELECT ou.id FROM org_units ou INNER JOIN downline_units d ON ou.parent_id = d.org_unit_id
            )
            SELECT org_unit_id FROM downline_units
        )`;

        targetConditions.push(or(
            eq(employees.supervisorId, processorId),
            inArray(employees.orgUnitId, authorityFilter)
        ));
    }

    const scopeClauses: (SQL<unknown> | undefined)[] = [];
    if (program.isMandatory) {
        // Global mandatory - no extra scope needed, condition is already broad
    } else {
        if (targetPosIds.length > 0) scopeClauses.push(inArray(employees.positionId, targetPosIds));
        if (targetOrgIds.length > 0) scopeClauses.push(inArray(employees.orgUnitId, targetOrgIds));
        
        if (scopeClauses.length === 0) return { count: 0, message: 'No specific requirements defined for this program' };
        
        const combinedScope = or(...scopeClauses);
        if (combinedScope) targetConditions.push(combinedScope);
    }

    const allCandidateIds = await this.db.db
      .select({ id: employees.id })
      .from(employees)
      .where(and(...targetConditions));

    if (allCandidateIds.length === 0) return { count: 0 };

    const candidateIds = allCandidateIds.map(c => c.id);

    // 4. Filter out those who have COMPLETED this program already
    const alreadyCompleted = await this.db.db
      .select({ employeeId: trainingEnrollments.employeeId })
      .from(trainingEnrollments)
      .innerJoin(trainingSchedules, eq(trainingEnrollments.scheduleId, trainingSchedules.id))
      .where(and(
        inArray(trainingEnrollments.employeeId, candidateIds),
        eq(trainingSchedules.programId, program.id),
        eq(trainingEnrollments.status, 'COMPLETED')
      ));
    
    const completedIds = new Set(alreadyCompleted.map(a => a.employeeId));

    // 5. Filter out those already ENROLLED in an active/upcoming session of this program
    const alreadyEnrolled = await this.db.db
      .select({ employeeId: trainingEnrollments.employeeId })
      .from(trainingEnrollments)
      .innerJoin(trainingSchedules, eq(trainingEnrollments.scheduleId, trainingSchedules.id))
      .where(and(
        inArray(trainingEnrollments.employeeId, candidateIds),
        eq(trainingSchedules.programId, program.id),
        inArray(trainingEnrollments.status, ['ENROLLED'])
      ));
    
    const enrolledIds = new Set(alreadyEnrolled.map(a => a.employeeId));

    // 6. Final list of employees to enroll
    const finalTargetIds = candidateIds.filter(id => !completedIds.has(id) && !enrolledIds.has(id));

    if (finalTargetIds.length === 0) return { count: 0 };

    // 7. Bulk Enroll
    await this.db.db.insert(trainingEnrollments).values(
        finalTargetIds.map(empId => ({
            scheduleId,
            employeeId: empId,
            status: 'ENROLLED' as TrainingEnrollmentStatus,
            processedById: processorId
        }))
    ).onConflictDoNothing();

    return { count: finalTargetIds.length };
  }

  // --- Mandatory Training Requirements ---

  async getPositionMandatoryTrainings(positionId: string) {
    return this.db.db
      .select({
        id: positionMandatoryTrainings.id,
        programId: trainingPrograms.id,
        title: trainingPrograms.title,
        type: trainingPrograms.type,
      })
      .from(positionMandatoryTrainings)
      .innerJoin(trainingPrograms, eq(positionMandatoryTrainings.programId, trainingPrograms.id))
      .where(eq(positionMandatoryTrainings.positionId, positionId));
  }

  async addMandatoryTrainingToPosition(positionId: string, programId: string) {
    const [inserted] = await this.db.db
      .insert(positionMandatoryTrainings)
      .values({ positionId, programId })
      .onConflictDoNothing()
      .returning();
    return inserted;
  }

  async removeMandatoryTrainingFromPosition(positionId: string, programId: string) {
    await this.db.db
      .delete(positionMandatoryTrainings)
      .where(and(eq(positionMandatoryTrainings.positionId, positionId), eq(positionMandatoryTrainings.programId, programId)));
    return { success: true };
  }

  async getOrgUnitMandatoryTrainings(orgUnitId: string) {
    return this.db.db
      .select({
        id: orgUnitMandatoryTrainings.id,
        programId: trainingPrograms.id,
        title: trainingPrograms.title,
        type: trainingPrograms.type,
      })
      .from(orgUnitMandatoryTrainings)
      .innerJoin(trainingPrograms, eq(orgUnitMandatoryTrainings.programId, trainingPrograms.id))
      .where(eq(orgUnitMandatoryTrainings.orgUnitId, orgUnitId));
  }

  async addMandatoryTrainingToOrgUnit(orgUnitId: string, programId: string) {
    const [inserted] = await this.db.db
      .insert(orgUnitMandatoryTrainings)
      .values({ orgUnitId, programId })
      .onConflictDoNothing()
      .returning();
    return inserted;
  }

  async removeMandatoryTrainingFromOrgUnit(orgUnitId: string, programId: string) {
    await this.db.db
      .delete(orgUnitMandatoryTrainings)
      .where(and(eq(orgUnitMandatoryTrainings.orgUnitId, orgUnitId), eq(orgUnitMandatoryTrainings.programId, programId)));
    return { success: true };
  }
}

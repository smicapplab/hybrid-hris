import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  employeeSkills,
} from '@hybrid-hris/db/schema';
import { eq, and, asc, sql, count, inArray, isNull } from 'drizzle-orm';
import { ProficiencyLevel, TrainingScheduleStatus, TrainingType, TrainingEnrollmentStatus } from '@hybrid-hris/domain';
import { Tx } from 'src/database/database.types';

@Injectable()
export class TrainingService {
  constructor(private readonly db: DatabaseService) {}

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

  async getMyTrainings(employeeId: string) {
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

  async createProgram(data: {
    title: string;
    description?: string;
    objectives?: string;
    type: TrainingType;
    isMandatory?: boolean;
    skillIds?: { id: string; level: ProficiencyLevel }[];
    prerequisiteIds?: string[];
  }) {
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
    data: {
      title?: string;
      description?: string;
      objectives?: string;
      type?: TrainingType;
      isMandatory?: boolean;
      skillIds?: { id: string; level: ProficiencyLevel }[];
      prerequisiteIds?: string[];
    },
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

  async createSchedule(data: {
    programId: string;
    location?: string;
    capacity?: number;
    startAt: Date;
    endAt: Date;
    trainerId?: string;
    externalTrainer?: string;
    sessions?: { title?: string; location?: string; startAt: Date; endAt: Date }[];
  }) {
    const { sessions, ...scheduleData } = data;

    return await this.db.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(trainingSchedules)
        .values({
          ...scheduleData,
          status: 'SCHEDULED',
        })
        .returning();

      if (sessions?.length) {
        await tx.insert(trainingScheduleSessions).values(
          sessions.map((s) => ({
            scheduleId: inserted.id,
            ...s,
          })),
        );
      }

      return inserted;
    });
  }

  async updateSchedule(
    id: string,
    data: {
      location?: string;
      capacity?: number;
      startAt?: Date;
      endAt?: Date;
      trainerId?: string;
      externalTrainer?: string;
      status?: TrainingScheduleStatus;
      sessions?: { title?: string; location?: string; startAt: Date; endAt: Date }[];
    },
  ) {
    const { sessions, ...scheduleData } = data;

    return await this.db.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(trainingSchedules)
        .set({
          ...scheduleData,
          updatedAt: new Date(),
        })
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

  async getScheduleAttendees(scheduleId: string) {
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
    data: { status: TrainingEnrollmentStatus; notes?: string },
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
    data: { status: TrainingEnrollmentStatus; notes?: string },
    processorId: string | null
  ) {
    return await this.db.db.transaction(async (tx) => {
      return await Promise.all(
        enrollmentIds.map(id => this.updateAttendeeStatus(id, data, processorId, tx))
      );
    });
  }

  async addAttendee(scheduleId: string, employeeId: string, processorId: string | null) {
    // Check if already enrolled
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
}

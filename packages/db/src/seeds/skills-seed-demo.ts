import { skills } from '../schema/skills';
import { employees } from '../schema/employees';
import { positions } from '../schema/positions';
import { trainingPrograms, trainingProgramSkills, trainingPrerequisites } from '../schema/training-programs';
import { trainingSchedules, trainingScheduleSessions } from '../schema/training-schedules';
import { trainingEnrollments } from '../schema/training-enrollments';
import { employeeSkills, employeeSkillEndorsements } from '../schema/employee-skills';
import { positionSkills } from '../schema/position-skills';
import { eq } from 'drizzle-orm';
import { ProficiencyLevel, SkillSource, SkillVerificationStatus, TrainingEnrollmentStatus, TrainingScheduleStatus } from '@hybrid-hris/domain';
import { faker } from '@faker-js/faker';

export async function seedSkillsDemo(db: any) {
    console.log('  - Seeding Rounded Demo Skills & Training Data (v2 with Traceability)...');

    const allSkills: any[] = await db.select().from(skills);
    const allEmployees: any[] = await db.select().from(employees).limit(100);
    const allPositions: any[] = await db.select().from(positions);

    if (allSkills.length === 0 || allEmployees.length === 0) {
        console.warn('    ⚠️ Skipping demo seeds: Missing skills or employees.');
        return;
    }

    const skillMap = new Map<string, string>();
    allSkills.forEach((s: any) => skillMap.set(s.name, s.id));

    const hrAdmin = allEmployees.find((e: any) => e.employeeNo === 'ADMIN-001') || allEmployees[0];
    const now = new Date();

    // --- 1. Diverse Training Programs ---
    console.log('    * Training Programs & Prerequisites...');
    const programsData = [
        {
            key: 'WEB_BASICS',
            title: 'Web Development Fundamentals',
            description: 'HTML, CSS, and basic JavaScript.',
            objectives: 'Understand the building blocks of the web.',
            type: 'INTERNAL',
            isMandatory: false,
            skills: [{ name: 'SQL', level: 'BEGINNER' }]
        },
        {
            key: 'TS_ADVANCED',
            title: 'Fullstack Web Development with TypeScript',
            description: 'Intensive course on the modern JS/TS ecosystem.',
            objectives: 'Master React, Node.js, and Type-safe development.',
            type: 'INTERNAL',
            isMandatory: false,
            prerequisiteKey: 'WEB_BASICS',
            skills: [
                { name: 'TypeScript', level: 'INTERMEDIATE' },
                { name: 'React', level: 'INTERMEDIATE' },
                { name: 'Node.js', level: 'BEGINNER' }
            ]
        },
        {
            key: 'LEADERSHIP',
            title: 'Leadership Foundations for Managers',
            description: 'Transitioning from contributor to leader.',
            objectives: 'Team management, delegation, and strategic planning.',
            type: 'INTERNAL',
            isMandatory: false,
            skills: [
                { name: 'Strategic Planning', level: 'INTERMEDIATE' },
                { name: 'Team Mentorship', level: 'INTERMEDIATE' },
                { name: 'Conflict Resolution', level: 'INTERMEDIATE' }
            ]
        },
        {
            key: 'GDPR',
            title: 'GDPR & Data Privacy Annual Workshop',
            description: 'Essential compliance training for all employees.',
            objectives: 'Understand PII handling and global regulations.',
            type: 'INTERNAL',
            isMandatory: true,
            skills: [{ name: 'Data Privacy (GDPR)', level: 'ADVANCED' }]
        }
    ];

    const programMap = new Map<string, string>();
    for (const p of programsData) {
        const [prog] = await db.insert(trainingPrograms).values({
            title: p.title,
            description: p.description,
            objectives: p.objectives,
            type: p.type as any,
            isMandatory: p.isMandatory
        }).returning();
        
        programMap.set(p.key, prog.id);

        for (const s of p.skills) {
            if (skillMap.has(s.name)) {
                await db.insert(trainingProgramSkills).values({
                    programId: prog.id,
                    skillId: skillMap.get(s.name)!,
                    grantedProficiencyLevel: s.level as ProficiencyLevel
                });
            }
        }
    }

    // Set prerequisites
    for (const p of programsData) {
        if (p.prerequisiteKey && programMap.has(p.prerequisiteKey)) {
            await db.insert(trainingPrerequisites).values({
                programId: programMap.get(p.key)!,
                prerequisiteProgramId: programMap.get(p.prerequisiteKey)!
            });
        }
    }

    // --- 2. Training Schedules & Multi-day Sessions ---
    console.log('    * Training Schedules & Multi-day Sessions...');
    for (const [key, progId] of programMap.entries()) {
        const isPast = key !== 'GDPR'; // Make GDPR upcoming
        const status = isPast ? 'COMPLETED' : 'SCHEDULED';
        const start = isPast ? new Date(now.getTime() - 86400000 * 30) : new Date(now.getTime() + 86400000 * 10);
        
        const [sch] = await db.insert(trainingSchedules).values({
            programId: progId,
            status: status as TrainingScheduleStatus,
            location: 'Conference Room Alpha',
            capacity: 20,
            startAt: start,
            endAt: new Date(start.getTime() + 3600000 * 8), // 8 hours later
            trainerId: faker.helpers.arrayElement(allEmployees).id
        }).returning();

        // Add 2 sessions for the "Fullstack" course to show multi-day support
        if (key === 'TS_ADVANCED') {
            await db.insert(trainingScheduleSessions).values([
                {
                    scheduleId: sch.id,
                    title: 'Day 1: React & Components',
                    startAt: sch.startAt,
                    endAt: new Date(sch.startAt.getTime() + 3600000 * 4)
                },
                {
                    scheduleId: sch.id,
                    title: 'Day 2: Node.js & APIs',
                    startAt: new Date(sch.startAt.getTime() + 86400000), // Next day
                    endAt: new Date(sch.startAt.getTime() + 86400000 + 3600000 * 4)
                }
            ]);
        }

        // --- 3. Enrollments with Skill Traceability & Endorsements ---
        const pool = faker.helpers.arrayElements(allEmployees, { min: 3, max: 8 });
        for (const emp of pool) {
            const [enrollment] = await db.insert(trainingEnrollments).values({
                scheduleId: sch.id,
                employeeId: (emp as any).id,
                status: status === 'COMPLETED' ? 'COMPLETED' : 'ENROLLED',
                processedAt: status === 'COMPLETED' ? new Date() : null,
                processedById: status === 'COMPLETED' ? hrAdmin.id : null
            }).returning();

            if (status === 'COMPLETED') {
                const progSkills = await db.select().from(trainingProgramSkills).where(eq(trainingProgramSkills.programId, progId));
                for (const ps of progSkills) {
                    const [empSkill] = await db.insert(employeeSkills).values({
                        employeeId: (emp as any).id,
                        skillId: ps.skillId,
                        trainingEnrollmentId: enrollment.id, // TRACEABILITY!
                        proficiencyLevel: ps.grantedProficiencyLevel,
                        source: 'INTERNAL_TRAINING' as SkillSource,
                        verificationStatus: 'VERIFIED' as SkillVerificationStatus,
                        acquiredDate: new Date().toISOString().slice(0, 10),
                        verifiedById: hrAdmin.id,
                        verifiedAt: new Date()
                    }).onConflictDoNothing().returning();

                    // Add 360 Endorsements for these skills
                    if (empSkill) {
                        const peers = faker.helpers.arrayElements(allEmployees.filter((e: any) => e.id !== (emp as any).id), 2);
                        for (const peer of peers) {
                            await db.insert(employeeSkillEndorsements).values({
                                employeeSkillId: empSkill.id,
                                endorserId: (peer as any).id,
                                message: faker.helpers.arrayElement([
                                    'Great work in the training session!',
                                    'Demonstrated excellent understanding of the concepts.',
                                    'Already applying these skills in our current project.',
                                    'Highly recommended for this skill level.'
                                ])
                            });
                        }
                    }
                }
            }
        }
    }

    // --- 4. Broad Position Skill Requirements ---
    console.log('    * Position Skill Requirements (Heatmap Ready)...');
    for (const pos of allPositions) {
        const title = (pos as any).title.toLowerCase();
        
        // Soft Skills for all
        if (skillMap.has('Time Management')) {
            await db.insert(positionSkills).values({
                positionId: (pos as any).id,
                skillId: skillMap.get('Time Management')!,
                requiredProficiencyLevel: 'INTERMEDIATE' as ProficiencyLevel
            }).onConflictDoNothing();
        }

        // Tech roles
        if (title.includes('software') || title.includes('developer')) {
            if (skillMap.has('TypeScript')) {
                await db.insert(positionSkills).values({
                    positionId: (pos as any).id,
                    skillId: skillMap.get('TypeScript')!,
                    requiredProficiencyLevel: 'ADVANCED' as ProficiencyLevel
                }).onConflictDoNothing();
            }
        }
    }
}

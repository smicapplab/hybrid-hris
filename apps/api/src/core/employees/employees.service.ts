import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { EmployeesRepository } from './employees.repository'
import { EmployeeFilterDto } from './dto/employee-filter.dto'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee-dto'
import { employees, leavePolicies, employeeLeavePolicies } from '@hybrid-hris/db/schema'
import { InferSelectModel, eq, and, isNull } from 'drizzle-orm'
import { DatabaseService } from 'src/database/database.service'
import { Tx } from 'src/database/database.types'

type EmployeeDbStatus = InferSelectModel<typeof employees>['status']

@Injectable()
export class EmployeesService {
    constructor(
        private readonly employeesRepository: EmployeesRepository,
        private readonly db: DatabaseService,
    ) { }

    private readonly allowedStatusTransitions: Record<EmployeeDbStatus, readonly EmployeeDbStatus[]> = {
        ACTIVE: ['SUSPENDED', 'RESIGNED', 'TERMINATED'],
        PROBATION: ['ACTIVE', 'RESIGNED', 'TERMINATED'],
        SUSPENDED: ['ACTIVE', 'TERMINATED'],
        RESIGNED: ['ACTIVE'],
        TERMINATED: ['ACTIVE'],
    } as const

    /**
     * Returns the allowed next statuses from the current status.
     * UI can mirror this logic to filter dropdown options.
     */
    getAllowedNextStatuses(current: EmployeeDbStatus): readonly EmployeeDbStatus[] {
        return this.allowedStatusTransitions[current] ?? []
    }

    private isAllowedStatusTransition(from: EmployeeDbStatus, to: EmployeeDbStatus): boolean {
        const allowed = this.allowedStatusTransitions[from]
        return Array.isArray(allowed) && allowed.includes(to)
    }

    private async hasActiveSubordinates(tx: Tx, id: string): Promise<boolean> {
        const subordinate = await this.employeesRepository.findFirstNonDeletedSubordinate(tx, id)
        return !!(
            subordinate &&
            subordinate.status !== 'TERMINATED' &&
            subordinate.status !== 'RESIGNED'
        )
    }

    private async hasCircularSupervisorChain(
        tx: Tx,
        employeeId: string,
        proposedSupervisorId: string,
    ): Promise<boolean> {
        let currentId: string | null = proposedSupervisorId

        while (currentId) {
            if (currentId === employeeId) return true
            const row = await this.employeesRepository.findEmployee(tx, currentId)
            if (!row) break
            currentId = row.supervisorId
        }

        return false
    }

    private async generateEmployeeNo(tx: Tx): Promise<string> {
        const settings = await this.employeesRepository.lockAndIncrementHrSettings(tx)

        if (!settings) {
            throw new NotFoundException('HR settings not initialized')
        }

        const padding = Number(settings.employeeNoPadding)
        const padded = String(settings.employeeNoNext).padStart(padding, '0')

        return `${settings.employeeNoPrefix}${padded}`
    }

    async findAll(filter: EmployeeFilterDto) {
        return this.employeesRepository.findWithFilters(this.db.db, filter)
    }

    async getHrConfig() {
        return this.employeesRepository.getHrConfig(this.db.db)
    }

    async findById(id: string) {
        const result = await this.employeesRepository.findByIdWithDetails(this.db.db, id)

        if (!result) {
            throw new NotFoundException('Employee not found')
        }

        return {
            ...result.employee,
            email: result.email ?? null,
            profile: result.profile ?? null,
            identifiers: result.identifiers ?? null,
            policyId: result.policyId ?? null,
        }
    }

    async create(dto: CreateEmployeeDto) {
        const hireDate = new Date(dto.hireDate)
        hireDate.setHours(0, 0, 0, 0)

        return this.db.withTransaction(async (tx) => {
            const employeeNo = dto.employeeNo ?? await this.generateEmployeeNo(tx)

            if (!await this.employeesRepository.findPositionById(tx, dto.positionId)) {
                throw new BadRequestException('Invalid positionId')
            }

            if (!await this.employeesRepository.findOrgUnitById(tx, dto.orgUnitId)) {
                throw new BadRequestException('Invalid orgUnitId')
            }

            if (!await this.employeesRepository.findOrgUnitPositionMapping(tx, dto.orgUnitId, dto.positionId)) {
                throw new BadRequestException('Position is not allowed in the specified org unit')
            }

            if (dto.supervisorId) {
                const supervisor = await this.employeesRepository.findEmployee(tx, dto.supervisorId)

                if (!supervisor) {
                    throw new BadRequestException('Invalid supervisorId')
                }

                if (supervisor.deletedAt || supervisor.status !== 'ACTIVE') {
                    throw new BadRequestException('Supervisor must be ACTIVE')
                }
            }

            const normalizedEmail = dto.email.toLowerCase().trim()

            if (await this.employeesRepository.findUserByEmail(tx, normalizedEmail)) {
                throw new BadRequestException('Login email already in use')
            }

            const passwordHash = await bcrypt.hash(dto.password, 10)

            const hrConfig = await this.employeesRepository.getHrConfig(tx)

            const employmentType = dto.employmentType ?? 'REGULAR'

            const [employee] = await this.employeesRepository.insertEmployee(tx, {
                employeeNo,
                firstName: dto.firstName,
                middleName: dto.middleName,
                lastName: dto.lastName,
                alternateEmail: dto.alternateEmail ?? null,
                orgUnitId: dto.orgUnitId,
                positionId: dto.positionId,
                supervisorId: dto.supervisorId ?? null,
                hireDate: dto.hireDate,
                employmentType,
                // PROBATIONARY hires start in PROBATION status; everyone else starts ACTIVE
                status: employmentType === 'PROBATIONARY' ? 'PROBATION' : 'ACTIVE',
                timezone: hrConfig?.timezone ?? 'UTC',
            })

            if (!employee) {
                throw new BadRequestException('Failed to create employee')
            }

            const [user] = await this.employeesRepository.insertUser(tx, {
                email: normalizedEmail,
                employeeId: employee.id,
                isActive: true,
                passwordHash,
            })

            await this.employeesRepository.assignEmployeeRoles(tx, {
                userId: user.id,
                additionalRoleIds: dto.roleIds ?? [],
            })

            // Auto-assign the default leave policy if one is configured
            const [defaultPolicy] = await tx
                .select({ id: leavePolicies.id })
                .from(leavePolicies)
                .where(and(eq(leavePolicies.isDefault, true), eq(leavePolicies.isActive, true)))
                .limit(1)

            if (defaultPolicy) {
                await tx
                    .insert(employeeLeavePolicies)
                    .values({
                        employeeId: employee.id,
                        policyId: defaultPolicy.id,
                        effectiveFrom: dto.hireDate,
                    })
            }

            return employee
        })
    }

    async update(id: string, dto: UpdateEmployeeDto) {
        return this.db.withTransaction(async (tx) => {
            const existing = await this.employeesRepository.findEmployee(tx, id)

            if (!existing) {
                throw new NotFoundException('Employee not found')
            }

            if (existing.deletedAt) {
                throw new BadRequestException('Cannot update a deleted employee')
            }

            if ('employeeNo' in dto) {
                throw new BadRequestException('employeeNo cannot be modified')
            }

            if (dto.hireDate !== undefined) {
                const hireDate = new Date(dto.hireDate)
                hireDate.setHours(0, 0, 0, 0)
            }

            if (dto.positionId && !await this.employeesRepository.findPositionById(tx, dto.positionId)) {
                throw new BadRequestException('Invalid positionId')
            }

            if (dto.email !== undefined) {
                const normalizedEmail = dto.email.toLowerCase().trim()
                const user = await this.employeesRepository.findUserByEmployeeId(tx, id)

                if (!user) {
                    throw new NotFoundException('Associated user not found')
                }

                if (normalizedEmail !== user.email) {
                    if (await this.employeesRepository.findUserByEmail(tx, normalizedEmail)) {
                        throw new BadRequestException('Login email already in use')
                    }

                    await this.employeesRepository.updateUserEmail(tx, user.id, normalizedEmail)
                }
            }

            if (dto.orgUnitId && !await this.employeesRepository.findOrgUnitById(tx, dto.orgUnitId)) {
                throw new BadRequestException('Invalid orgUnitId')
            }

            if (dto.supervisorId) {
                if (dto.supervisorId === id) {
                    throw new BadRequestException('Employee cannot supervise themselves')
                }

                const supervisor = await this.employeesRepository.findEmployee(tx, dto.supervisorId)

                if (!supervisor) {
                    throw new BadRequestException('Invalid supervisorId')
                }

                if (supervisor.deletedAt || supervisor.status !== 'ACTIVE') {
                    throw new BadRequestException('Supervisor must be ACTIVE')
                }

                if (await this.hasCircularSupervisorChain(tx, id, dto.supervisorId)) {
                    throw new BadRequestException('Circular supervisor hierarchy detected')
                }
            }

            const effectiveOrgUnitId = dto.orgUnitId ?? existing.orgUnitId
            const effectivePositionId = dto.positionId ?? existing.positionId

            if (!await this.employeesRepository.findOrgUnitPositionMapping(tx, effectiveOrgUnitId, effectivePositionId)) {
                throw new BadRequestException('Position is not allowed in the specified org unit')
            }

            const allowedFields: (keyof InferSelectModel<typeof employees>)[] = [
                'firstName', 'middleName', 'lastName', 'alternateEmail',
                'hireDate', 'employmentType', 'addressLine1', 'addressLine2',
                'city', 'province', 'postalCode', 'countryCode', 'timezone',
                'orgUnitId', 'positionId', 'supervisorId',
            ]

            const updatePayload: Partial<InferSelectModel<typeof employees>> = {}

            for (const field of allowedFields) {
                const value = dto[field as keyof UpdateEmployeeDto]
                if (value !== undefined) {
                    updatePayload[field] = value as never
                }
            }

            updatePayload.updatedAt = new Date()

            const updated = await this.employeesRepository.updateEmployee(tx, id, updatePayload)

            if (dto.profile) {
                await this.employeesRepository.upsertProfile(tx, id, {
                    birthDate: dto.profile.birthDate ?? null,
                    gender: dto.profile.gender ?? null,
                    civilStatus: dto.profile.civilStatus ?? null,
                    nationality: dto.profile.nationality ?? null,
                    personalEmail: dto.profile.personalEmail ?? null,
                    mobileNo: dto.profile.mobileNo ?? null,
                    landlineNo: dto.profile.landlineNo ?? null,
                    emergencyContactName: dto.profile.emergencyContactName ?? null,
                    emergencyContactRelationship: dto.profile.emergencyContactRelationship ?? null,
                    emergencyContactMobileNo: dto.profile.emergencyContactMobileNo ?? null,
                    notes: dto.profile.notes ?? null,
                    updatedAt: new Date(),
                })
            }

            if (dto.identifiers) {
                await this.employeesRepository.upsertIdentifiers(tx, id, {
                    tinNo: dto.identifiers.tinNo ?? null,
                    sssNo: dto.identifiers.sssNo ?? null,
                    philHealthNo: dto.identifiers.philHealthNo ?? null,
                    pagIbigNo: dto.identifiers.pagIbigNo ?? null,
                    umidNo: dto.identifiers.umidNo ?? null,
                    passportNo: dto.identifiers.passportNo ?? null,
                    passportExpiry: dto.identifiers.passportExpiry ?? null,
                    driversLicenseNo: dto.identifiers.driversLicenseNo ?? null,
                    driversLicenseExpiry: dto.identifiers.driversLicenseExpiry ?? null,
                    prcLicenseNo: dto.identifiers.prcLicenseNo ?? null,
                    prcLicenseExpiry: dto.identifiers.prcLicenseExpiry ?? null,
                    companyIdNo: dto.identifiers.companyIdNo ?? null,
                    updatedAt: new Date(),
                })
            }

            if (dto.policyId !== undefined) {
                const targetPolicyId = dto.policyId as string;

                // Find the currently active (no end date) policy record
                const [currentPolicyRecord] = await tx.select()
                    .from(employeeLeavePolicies)
                    .where(and(
                        eq(employeeLeavePolicies.employeeId, id),
                        isNull(employeeLeavePolicies.effectiveTo)
                    ))
                    .limit(1);

                const currentPolicyId = currentPolicyRecord?.policyId;

                if (targetPolicyId !== currentPolicyId) {
                    const today = new Date().toISOString().slice(0, 10);

                    // If the current policy started today, we can just update or remove it
                    if (currentPolicyRecord && currentPolicyRecord.effectiveFrom === today) {
                        if (targetPolicyId) {
                            // Ensure the policy exists and is active
                            const [policy] = await tx.select()
                                .from(leavePolicies)
                                .where(and(
                                    eq(leavePolicies.id, targetPolicyId),
                                    eq(leavePolicies.isActive, true)
                                ))
                                .limit(1);

                            if (!policy) throw new BadRequestException('Invalid or inactive policyId');

                            await tx.update(employeeLeavePolicies)
                                .set({ policyId: targetPolicyId })
                                .where(eq(employeeLeavePolicies.id, currentPolicyRecord.id));
                        } else {
                            // Removing policy that just started today — just delete it
                            await tx.delete(employeeLeavePolicies)
                                .where(eq(employeeLeavePolicies.id, currentPolicyRecord.id));
                        }
                    } else {
                        // Current policy started before today — end it today and start a new one (if provided)
                        if (currentPolicyRecord) {
                            await tx.update(employeeLeavePolicies)
                                .set({ effectiveTo: today })
                                .where(eq(employeeLeavePolicies.id, currentPolicyRecord.id));
                        }

                        if (targetPolicyId) {
                            // Ensure the policy exists and is active
                            const [policy] = await tx.select()
                                .from(leavePolicies)
                                .where(and(
                                    eq(leavePolicies.id, targetPolicyId),
                                    eq(leavePolicies.isActive, true)
                                ))
                                .limit(1);

                            if (!policy) throw new BadRequestException('Invalid or inactive policyId');

                            await tx.insert(employeeLeavePolicies)
                                .values({
                                    employeeId: id,
                                    policyId: targetPolicyId,
                                    effectiveFrom: today,
                                });
                        }
                    }
                }
            }

            return updated
        })
    }

    async changeStatus(id: string, status: EmployeeDbStatus) {
        return this.db.withTransaction(async (tx) => {
            const employee = await this.employeesRepository.findEmployee(tx, id)

            if (!employee) {
                throw new NotFoundException('Employee not found')
            }

            if (employee.deletedAt) {
                throw new BadRequestException('Cannot change status of a deleted employee')
            }

            if (!this.isAllowedStatusTransition(employee.status, status)) {
                throw new BadRequestException('Invalid status transition')
            }

            if (status === 'RESIGNED') {
                if (await this.hasActiveSubordinates(tx, id)) {
                    throw new BadRequestException(
                        'Cannot mark employee as resigned while supervising active subordinates',
                    )
                }
            }

            // Rehire flow: RESIGNED or TERMINATED → ACTIVE
            if (status === 'ACTIVE' && (employee.status === 'RESIGNED' || employee.status === 'TERMINATED')) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const newEmployeeNo = await this.generateEmployeeNo(tx)

                const rehired = await this.employeesRepository.updateEmployee(tx, id, {
                    employeeNo: newEmployeeNo,
                    hireDate: today.toISOString().slice(0, 10),
                    status: 'ACTIVE',
                    deletedAt: null,
                    updatedAt: new Date(),
                })

                await this.employeesRepository.setUserActive(tx, id, true)

                // TODO: Reset leave balances (implement once leave module exists)

                return rehired
            }

            if (status === 'TERMINATED') {
                if (await this.hasActiveSubordinates(tx, id)) {
                    throw new BadRequestException(
                        'Cannot terminate employee while supervising active subordinates',
                    )
                }

                await this.employeesRepository.setUserActive(tx, id, false)
            }

            return this.employeesRepository.updateEmployee(tx, id, {
                status,
                updatedAt: new Date(),
            })
        })
    }

    async softDelete(id: string) {
        return this.db.withTransaction(async (tx) => {
            const employee = await this.employeesRepository.findEmployee(tx, id)

            if (!employee) {
                throw new NotFoundException('Employee not found')
            }

            if (await this.hasActiveSubordinates(tx, id)) {
                throw new BadRequestException(
                    'Cannot delete employee while supervising active subordinates',
                )
            }

            await this.employeesRepository.setUserActive(tx, id, false)

            return this.employeesRepository.updateEmployee(tx, id, {
                deletedAt: new Date(),
                status: 'TERMINATED',
                updatedAt: new Date(),
            })
        })
    }
}
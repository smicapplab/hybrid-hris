import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { EmployeesRepository } from './employees.repository'
import { EmployeeFilterDto } from './dto/employee-filter.dto'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { DatabaseService } from 'src/database/database.service'
import { hrSettings, positions } from '@hybrid-hris/db'
import { InferSelectModel, eq, and, isNull } from 'drizzle-orm'
import { UpdateEmployeeDto } from './dto/update-employee-dto'
import { employees, orgUnits, orgUnitPositions } from '@hybrid-hris/db'
import { users } from '@hybrid-hris/db'

@Injectable()
export class EmployeesService {
    constructor(
        private readonly employeesRepository: EmployeesRepository,
        private readonly db: DatabaseService,
    ) { }

    async findAll(filter: EmployeeFilterDto) {
        return this.employeesRepository.findWithFilters(filter)
    }

    async create(dto: CreateEmployeeDto) {
        // Validate hire date (cannot be in the future)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const hireDate = new Date(dto.hireDate)
        hireDate.setHours(0, 0, 0, 0)

        if (hireDate > today) {
            throw new BadRequestException('Hire date cannot be in the future')
        }
        return this.db.db.transaction(async (tx) => {
            // Lock hr_settings row
            const [settings]: InferSelectModel<typeof hrSettings>[] = await tx
                .select()
                .from(hrSettings)
                .limit(1)
                .for('update')

            if (!settings) {
                throw new NotFoundException('HR settings not initialized')
            }

            // Generate employee number if not provided
            let employeeNo = dto.employeeNo

            if (!employeeNo) {
                const nextValue = settings.employeeNoNext

                await tx
                    .update(hrSettings)
                    .set({ employeeNoNext: nextValue + 1 })

                const padding = Number(settings.employeeNoPadding)
                const padded = String(nextValue).padStart(
                    padding,
                    '0',
                )

                employeeNo = `${settings.employeeNoPrefix}${padded}`
            }

            // Validate position exists
            const positionExists = await tx
                .select()
                .from(positions)
                .where(eq(positions.id, dto.positionId))
                .limit(1)

            if (!positionExists.length) {
                throw new BadRequestException('Invalid positionId')
            }

            // Validate org unit exists
            const [orgUnit] = await tx
                .select()
                .from(orgUnits)
                .where(eq(orgUnits.id, dto.orgUnitId))
                .limit(1)

            if (!orgUnit) {
                throw new BadRequestException('Invalid orgUnitId')
            }

            // Enforce orgUnit-position consistency
            const [mapping] = await tx
                .select()
                .from(orgUnitPositions)
                .where(
                    and(
                        eq(orgUnitPositions.orgUnitId, dto.orgUnitId),
                        eq(orgUnitPositions.positionId, dto.positionId),
                    ),
                )
                .limit(1)

            if (!mapping) {
                throw new BadRequestException(
                    'Position is not allowed in the specified org unit',
                )
            }

            // Validate supervisor consistency if provided
            if (dto.supervisorId) {
                const [supervisor] = await tx
                    .select()
                    .from(employees)
                    .where(eq(employees.id, dto.supervisorId))
                    .limit(1)

                if (!supervisor) {
                    throw new BadRequestException('Invalid supervisorId')
                }

                if (supervisor.deletedAt || supervisor.status !== 'ACTIVE') {
                    throw new BadRequestException('Supervisor must be ACTIVE')
                }
            }

            // Enforce unique login email
            const [emailConflict] = await tx
                .select({ id: users.id })
                .from(users)
                .where(eq(users.email, dto.email))
                .limit(1)

            if (emailConflict) {
                throw new BadRequestException('Login email already in use')
            }

            // Insert employee
            const [employee] = await this.employeesRepository.insertEmployee(tx, {
                employeeNo,
                firstName: dto.firstName,
                middleName: dto.middleName,
                lastName: dto.lastName,
                orgUnitId: dto.orgUnitId,
                positionId: dto.positionId,
                supervisorId: dto.supervisorId ?? null,
                hireDate: dto.hireDate,
            })

            if (!employee) {
                throw new BadRequestException('Failed to create employee')
            }


            // Create user
            const [user] = await this.employeesRepository.insertUser(tx, {
                email: dto.email,
                employeeId: employee.id,
                isActive: true,
            })

            // Assign EMPLOYEE role (and additional roles if provided)
            await this.employeesRepository.assignEmployeeRoles(tx, {
                userId: user.id,
                additionalRoleIds: dto.roleIds ?? [],
            })

            return employee
        })
    }

    async update(id: string, dto: UpdateEmployeeDto) {
        return this.db.db.transaction(async (tx) => {
            // Load existing employee
            const [existing] = await tx
                .select()
                .from(employees)
                .where(eq(employees.id, id))
                .limit(1)

            if (!existing) {
                throw new NotFoundException('Employee not found')
            }

            if (existing.deletedAt) {
                throw new BadRequestException('Cannot update a deleted employee')
            }

            // Prevent immutable field updates (defensive check)
            if ('employeeNo' in dto || 'hireDate' in dto) {
                throw new BadRequestException('employeeNo and hireDate cannot be modified')
            }

            // Validate position if provided
            if (dto.positionId) {
                const [position] = await tx
                    .select()
                    .from(positions)
                    .where(eq(positions.id, dto.positionId))
                    .limit(1)

                if (!position) {
                    throw new BadRequestException('Invalid positionId')
                }
            }

            // Validate org unit if provided
            if (dto.orgUnitId) {
                const [orgUnit] = await tx
                    .select()
                    .from(orgUnits)
                    .where(eq(orgUnits.id, dto.orgUnitId))
                    .limit(1)

                if (!orgUnit) {
                    throw new BadRequestException('Invalid orgUnitId')
                }
            }

            // Validate supervisor
            if (dto.supervisorId) {
                if (dto.supervisorId === id) {
                    throw new BadRequestException('Employee cannot supervise themselves')
                }

                const [supervisor] = await tx
                    .select()
                    .from(employees)
                    .where(eq(employees.id, dto.supervisorId))
                    .limit(1)

                if (!supervisor) {
                    throw new BadRequestException('Invalid supervisorId')
                }

                if (supervisor.deletedAt || supervisor.status !== 'ACTIVE') {
                    throw new BadRequestException('Supervisor must be ACTIVE')
                }

                // Prevent circular supervision
                let currentSupervisorId = supervisor.supervisorId

                while (currentSupervisorId) {
                    if (currentSupervisorId === id) {
                        throw new BadRequestException('Circular supervisor hierarchy detected')
                    }

                    const [parent] = await tx
                        .select()
                        .from(employees)
                        .where(eq(employees.id, currentSupervisorId))
                        .limit(1)

                    if (!parent) break

                    currentSupervisorId = parent.supervisorId
                }
            }

            // Enforce orgUnit-position consistency
            const effectiveOrgUnitId = dto.orgUnitId ?? existing.orgUnitId
            const effectivePositionId = dto.positionId ?? existing.positionId

            const [mapping] = await tx
                .select()
                .from(orgUnitPositions)
                .where(
                    and(
                        eq(orgUnitPositions.orgUnitId, effectiveOrgUnitId),
                        eq(orgUnitPositions.positionId, effectivePositionId),
                    ),
                )
                .limit(1)

            if (!mapping) {
                throw new BadRequestException(
                    'Position is not allowed in the specified org unit',
                )
            }

            // Build safe update payload (exclude undefined fields)
            const updatePayload: Partial<InferSelectModel<typeof employees>> = {}

            const allowedFields: (keyof InferSelectModel<typeof employees>)[] = [
                'firstName',
                'middleName',
                'lastName',
                'alternateEmail',
                'employmentType',
                'addressLine1',
                'addressLine2',
                'city',
                'province',
                'postalCode',
                'countryCode',
                'orgUnitId',
                'positionId',
                'supervisorId',
            ]

            for (const field of allowedFields) {
                const value = dto[field as keyof UpdateEmployeeDto]
                if (value !== undefined) {
                    updatePayload[field] = value as never
                }
            }

            updatePayload['updatedAt'] = new Date()

            const [updated] = await tx
                .update(employees)
                .set(updatePayload)
                .where(eq(employees.id, id))
                .returning()

            return updated
        })
    }

    async changeStatus(
        id: string,
        status: InferSelectModel<typeof employees>['status'],
    ) {
        return this.db.db.transaction(async (tx) => {
            const [employee] = await tx
                .select()
                .from(employees)
                .where(eq(employees.id, id))
                .limit(1)

            if (!employee) {
                throw new NotFoundException('Employee not found')
            }

            if (employee.deletedAt) {
                throw new BadRequestException('Cannot change status of a deleted employee')
            }

            type EmployeeStatus = InferSelectModel<typeof employees>['status']

            const allowedTransitions: Record<EmployeeStatus, EmployeeStatus[]> = {
                ACTIVE: ['SUSPENDED', 'RESIGNED', 'TERMINATED'],
                PROBATION: ['ACTIVE', 'RESIGNED', 'TERMINATED'],
                SUSPENDED: ['ACTIVE', 'TERMINATED'],
                RESIGNED: ['ACTIVE'],
                TERMINATED: ['ACTIVE'],
            }

            const currentStatus = employee.status

            if (!allowedTransitions[currentStatus]?.includes(status)) {
                throw new BadRequestException('Invalid status transition')
            }

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // RESIGNED subordinate-block check
            if (status === 'RESIGNED') {
                const [subordinate] = await tx
                    .select()
                    .from(employees)
                    .where(
                        and(
                            eq(employees.supervisorId, id),
                            isNull(employees.deletedAt),
                        ),
                    )
                    .limit(1)

                if (
                    subordinate &&
                    subordinate.status !== 'TERMINATED' &&
                    subordinate.status !== 'RESIGNED'
                ) {
                    throw new BadRequestException(
                        'Cannot mark employee as resigned while supervising active subordinates',
                    )
                }
            }

            // Rehire flow: RESIGNED or TERMINATED → ACTIVE
            if (
                status === 'ACTIVE' &&
                (currentStatus === 'RESIGNED' || currentStatus === 'TERMINATED')
            ) {
                // Lock HR settings for new employee number
                const [settings] = await tx
                    .select()
                    .from(hrSettings)
                    .limit(1)
                    .for('update')

                if (!settings) {
                    throw new NotFoundException('HR settings not initialized')
                }

                const nextValue = settings.employeeNoNext

                await tx
                    .update(hrSettings)
                    .set({ employeeNoNext: nextValue + 1 })

                const padding = Number(settings.employeeNoPadding)
                const padded = String(nextValue).padStart(padding, '0')
                const newEmployeeNo = `${settings.employeeNoPrefix}${padded}`

                // Reset hire date, employee number, and status
                const [rehired] = await tx
                    .update(employees)
                    .set({
                        employeeNo: newEmployeeNo,
                        hireDate: today.toISOString().slice(0, 10),
                        status: 'ACTIVE',
                        deletedAt: null,
                        updatedAt: new Date(),
                    })
                    .where(eq(employees.id, id))
                    .returning()

                // Reactivate user account
                await tx
                    .update(users)
                    .set({ isActive: true })
                    .where(eq(users.employeeId, id))

                // TODO: Reset leave balances (implement once leave module exists)

                return rehired
            }

            if (status === 'TERMINATED') {
                const [subordinate] = await tx
                    .select()
                    .from(employees)
                    .where(
                        and(
                            eq(employees.supervisorId, id),
                            isNull(employees.deletedAt),
                        ),
                    )
                    .limit(1)

                if (subordinate && subordinate.status !== 'TERMINATED' && subordinate.status !== 'RESIGNED') {
                    throw new BadRequestException(
                        'Cannot terminate employee while supervising active subordinates',
                    )
                }

                // Deactivate associated user on termination
                await tx
                    .update(users)
                    .set({ isActive: false })
                    .where(eq(users.employeeId, id))
            }

            const [updated] = await tx
                .update(employees)
                .set({
                    status: status,
                    updatedAt: new Date(),
                })
                .where(eq(employees.id, id))
                .returning()

            return updated
        })
    }

    async softDelete(id: string) {
        return this.db.db.transaction(async (tx) => {
            const [employee] = await tx
                .select()
                .from(employees)
                .where(eq(employees.id, id))
                .limit(1)

            if (!employee) {
                throw new NotFoundException('Employee not found')
            }

            // Block deletion if employee still supervises active subordinates
            const [subordinate] = await tx
                .select()
                .from(employees)
                .where(
                    and(
                        eq(employees.supervisorId, id),
                        isNull(employees.deletedAt),
                    ),
                )
                .limit(1)

            if (subordinate && subordinate.status !== 'TERMINATED' && subordinate.status !== 'RESIGNED') {
                throw new BadRequestException(
                    'Cannot delete employee while supervising active subordinates',
                )
            }

            // Deactivate associated user on soft delete
            await tx
                .update(users)
                .set({ isActive: false })
                .where(eq(users.employeeId, id))

            const [deleted] = await tx
                .update(employees)
                .set({
                    deletedAt: new Date(),
                    status: 'TERMINATED' as InferSelectModel<typeof employees>['status'],
                    updatedAt: new Date(),
                })
                .where(eq(employees.id, id))
                .returning()

            return deleted
        })
    }
}

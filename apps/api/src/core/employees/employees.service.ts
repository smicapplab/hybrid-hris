import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { EmployeesRepository } from './employees.repository'
import { EmployeeFilterDto } from './dto/employee-filter.dto'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { DatabaseService } from 'src/database/database.service'
import { hrSettings, positions } from '@hybrid-hris/db'
import { InferSelectModel, eq } from 'drizzle-orm'

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
            // 1️⃣ Lock hr_settings row
            const [settings]: InferSelectModel<typeof hrSettings>[] = await tx
                .select()
                .from(hrSettings)
                .limit(1)
                .for('update')

            if (!settings) {
                throw new NotFoundException('HR settings not initialized')
            }

            // 2️⃣ Generate employee number if not provided
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

            // 3️⃣ Insert employee
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

            // 4️⃣ Create user
            const [user] = await this.employeesRepository.insertUser(tx, {
                email: dto.email,
                employeeId: employee.id,
                isActive: true,
            })

            // 5️⃣ Assign EMPLOYEE role (and additional roles if provided)
            await this.employeesRepository.assignEmployeeRoles(tx, {
                userId: user.id,
                additionalRoleIds: dto.roleIds ?? [],
            })

            return employee
        })
    }
}

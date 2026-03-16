import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { thirteenthMonthLedger, employees, orgUnits, positions } from '@hybrid-hris/db';
import { eq, sql, and, sum } from 'drizzle-orm';

@Injectable()
export class ThirteenthMonthService {
    constructor(private readonly db: DatabaseService) {}

    async getAnnualSummary(year: string) {
        // Aggregate accruals by employee for a specific year
        return this.db.db
            .select({
                employeeId: employees.id,
                employeeNo: employees.employeeNo,
                firstName: employees.firstName,
                lastName: employees.lastName,
                orgUnitName: orgUnits.name,
                positionTitle: positions.title,
                totalAccrued: sum(thirteenthMonthLedger.accrualAmount),
            })
            .from(employees)
            .leftJoin(thirteenthMonthLedger, and(
                eq(employees.id, thirteenthMonthLedger.employeeId),
                eq(thirteenthMonthLedger.year, year)
            ))
            .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
            .leftJoin(positions, eq(employees.positionId, positions.id))
            .groupBy(
                employees.id, 
                employees.employeeNo, 
                employees.firstName, 
                employees.lastName,
                orgUnits.name,
                positions.title
            );
    }

    async getEmployeeDetails(employeeId: string, year: string) {
        return this.db.db
            .select()
            .from(thirteenthMonthLedger)
            .where(and(
                eq(thirteenthMonthLedger.employeeId, employeeId),
                eq(thirteenthMonthLedger.year, year)
            ))
            .orderBy(thirteenthMonthLedger.month);
    }
}

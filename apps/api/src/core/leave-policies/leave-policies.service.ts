import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { leavePolicies, leavePolicyRules, leaveTypes } from '@hybrid-hris/db/schema'
import { AccrualMethod } from '@hybrid-hris/domain'
import { and, eq, ilike, or, asc } from 'drizzle-orm'

@Injectable()
export class LeavePoliciesService {
    constructor(private readonly db: DatabaseService) { }

    // ─── Policies ───────────────────────────────────────────────────────────────

    async getAll(filters?: {
        search?: string
        active?: boolean
    }) {
        const conditions = []

        if (filters?.active !== undefined) {
            conditions.push(eq(leavePolicies.isActive, filters.active))
        }

        if (filters?.search) {
            conditions.push(
                or(
                    ilike(leavePolicies.name, `%${filters.search}%`),
                    ilike(leavePolicies.code, `%${filters.search}%`),
                ),
            )
        }

        const query = this.db.db
            .select({
                id: leavePolicies.id,
                code: leavePolicies.code,
                name: leavePolicies.name,
                description: leavePolicies.description,
                isActive: leavePolicies.isActive,
                isDefault: leavePolicies.isDefault,
                effectiveFrom: leavePolicies.effectiveFrom,
                effectiveTo: leavePolicies.effectiveTo,
                createdAt: leavePolicies.createdAt,
                updatedAt: leavePolicies.updatedAt,
            })
            .from(leavePolicies)
            .orderBy(asc(leavePolicies.name))

        if (conditions.length > 0) {
            return query.where(and(...conditions))
        }

        return query
    }

    async getById(id: string) {
        const policyResult = await this.db.db
            .select()
            .from(leavePolicies)
            .where(eq(leavePolicies.id, id))
            .limit(1)

        if (!policyResult.length) {
            throw new NotFoundException('Leave policy not found')
        }

        const policy = policyResult[0]

        const rules = await this.db.db
            .select({
                id: leavePolicyRules.id,
                policyId: leavePolicyRules.policyId,
                leaveTypeId: leavePolicyRules.leaveTypeId,
                leaveTypeName: leaveTypes.name,
                leaveTypeCode: leaveTypes.code,
                accrualMethod: leavePolicyRules.accrualMethod,
                accrualRatePerMonth: leavePolicyRules.accrualRatePerMonth,
                annualGrantAmount: leavePolicyRules.annualGrantAmount,
                maxBalance: leavePolicyRules.maxBalance,
                maxCarryOver: leavePolicyRules.maxCarryOver,
                allowNegativeBalance: leavePolicyRules.allowNegativeBalance,
                createdAt: leavePolicyRules.createdAt,
            })
            .from(leavePolicyRules)
            .leftJoin(leaveTypes, eq(leaveTypes.id, leavePolicyRules.leaveTypeId))
            .where(eq(leavePolicyRules.policyId, id))
            .orderBy(asc(leaveTypes.name))

        return { ...policy, rules }
    }

    async create(data: {
        code: string
        name: string
        description?: string
        effectiveFrom: string
        effectiveTo?: string
    }) {
        const existing = await this.db.db
            .select({ id: leavePolicies.id })
            .from(leavePolicies)
            .where(eq(leavePolicies.code, data.code))
            .limit(1)

        if (existing.length) {
            throw new ConflictException(`Leave policy with code '${data.code}' already exists`)
        }

        const inserted = await this.db.db
            .insert(leavePolicies)
            .values({
                code: data.code,
                name: data.name,
                description: data.description ?? null,
                isActive: true,
                effectiveFrom: data.effectiveFrom,
                effectiveTo: data.effectiveTo ?? null,
            })
            .returning()

        return inserted[0]
    }

    async update(
        id: string,
        data: {
            code?: string
            name?: string
            description?: string
            effectiveFrom?: string
            effectiveTo?: string | null
        },
    ) {
        const existing = await this.getById(id)

        if (data.code && data.code !== existing.code) {
            const conflict = await this.db.db
                .select({ id: leavePolicies.id })
                .from(leavePolicies)
                .where(eq(leavePolicies.code, data.code))
                .limit(1)

            if (conflict.length) {
                throw new ConflictException(`Leave policy with code '${data.code}' already exists`)
            }
        }

        const updated = await this.db.db
            .update(leavePolicies)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(leavePolicies.id, existing.id))
            .returning()

        return updated[0]
    }

    async deactivate(id: string) {
        const existing = await this.getById(id)

        await this.db.db
            .update(leavePolicies)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(leavePolicies.id, existing.id))

        return { success: true }
    }

    async activate(id: string) {
        const existing = await this.getById(id)

        await this.db.db
            .update(leavePolicies)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(leavePolicies.id, existing.id))

        return { success: true }
    }

    async setDefault(id: string) {
        // Ensure the target policy exists
        await this.getById(id)

        return this.db.withTransaction(async (tx) => {
            // Clear any existing default first (partial unique index only allows one)
            await tx
                .update(leavePolicies)
                .set({ isDefault: false, updatedAt: new Date() })
                .where(eq(leavePolicies.isDefault, true))

            // Set this policy as the default
            const updated = await tx
                .update(leavePolicies)
                .set({ isDefault: true, updatedAt: new Date() })
                .where(eq(leavePolicies.id, id))
                .returning()

            return updated[0]
        })
    }

    // ─── Policy Rules ────────────────────────────────────────────────────────────

    async addRule(
        policyId: string,
        data: {
            leaveTypeId: string
            accrualMethod: AccrualMethod
            accrualRatePerMonth?: string
            annualGrantAmount?: string
            maxBalance?: string
            maxCarryOver?: string
            allowNegativeBalance?: boolean
        },
    ) {
        // Ensure policy exists
        await this.getById(policyId)

        // Validate accrual method consistency
        if (data.accrualMethod === AccrualMethod.MONTHLY && !data.accrualRatePerMonth) {
            throw new BadRequestException('accrualRatePerMonth is required for MONTHLY accrual method')
        }

        if (data.accrualMethod === AccrualMethod.ANNUAL_GRANT && !data.annualGrantAmount) {
            throw new BadRequestException('annualGrantAmount is required for ANNUAL_GRANT accrual method')
        }

        // Check leave type exists
        const leaveTypeResult = await this.db.db
            .select({ id: leaveTypes.id })
            .from(leaveTypes)
            .where(eq(leaveTypes.id, data.leaveTypeId))
            .limit(1)

        if (!leaveTypeResult.length) {
            throw new NotFoundException('Leave type not found')
        }

        // Check uniqueness of policyId + leaveTypeId
        const duplicate = await this.db.db
            .select({ id: leavePolicyRules.id })
            .from(leavePolicyRules)
            .where(
                and(
                    eq(leavePolicyRules.policyId, policyId),
                    eq(leavePolicyRules.leaveTypeId, data.leaveTypeId),
                ),
            )
            .limit(1)

        if (duplicate.length) {
            throw new ConflictException('A rule for this leave type already exists in this policy')
        }

        const inserted = await this.db.db
            .insert(leavePolicyRules)
            .values({
                policyId,
                leaveTypeId: data.leaveTypeId,
                accrualMethod: data.accrualMethod,
                accrualRatePerMonth: data.accrualRatePerMonth ?? null,
                annualGrantAmount: data.annualGrantAmount ?? null,
                maxBalance: data.maxBalance ?? null,
                maxCarryOver: data.maxCarryOver ?? null,
                allowNegativeBalance: data.allowNegativeBalance ?? false,
            })
            .returning()

        return inserted[0]
    }

    async updateRule(
        policyId: string,
        ruleId: string,
        data: {
            accrualMethod?: AccrualMethod
            accrualRatePerMonth?: string | null
            annualGrantAmount?: string | null
            maxBalance?: string | null
            maxCarryOver?: string | null
            allowNegativeBalance?: boolean
        },
    ) {
        // Ensure policy exists
        await this.getById(policyId)

        const ruleResult = await this.db.db
            .select()
            .from(leavePolicyRules)
            .where(
                and(
                    eq(leavePolicyRules.id, ruleId),
                    eq(leavePolicyRules.policyId, policyId),
                ),
            )
            .limit(1)

        if (!ruleResult.length) {
            throw new NotFoundException('Policy rule not found')
        }

        const rule = ruleResult[0]

        // Validate accrual method consistency against the merged state
        const resolvedMethod = data.accrualMethod ?? rule.accrualMethod
        const resolvedRate = data.accrualRatePerMonth !== undefined
            ? data.accrualRatePerMonth
            : rule.accrualRatePerMonth
        const resolvedGrant = data.annualGrantAmount !== undefined
            ? data.annualGrantAmount
            : rule.annualGrantAmount

        if (resolvedMethod === AccrualMethod.MONTHLY && !resolvedRate) {
            throw new BadRequestException('accrualRatePerMonth is required for MONTHLY accrual method')
        }

        if (resolvedMethod === AccrualMethod.ANNUAL_GRANT && !resolvedGrant) {
            throw new BadRequestException('annualGrantAmount is required for ANNUAL_GRANT accrual method')
        }

        const updated = await this.db.db
            .update(leavePolicyRules)
            .set(data)
            .where(eq(leavePolicyRules.id, ruleId))
            .returning()

        return updated[0]
    }

    async removeRule(policyId: string, ruleId: string) {
        // Ensure policy exists
        await this.getById(policyId)

        const ruleResult = await this.db.db
            .select({ id: leavePolicyRules.id })
            .from(leavePolicyRules)
            .where(
                and(
                    eq(leavePolicyRules.id, ruleId),
                    eq(leavePolicyRules.policyId, policyId),
                ),
            )
            .limit(1)

        if (!ruleResult.length) {
            throw new NotFoundException('Policy rule not found')
        }

        await this.db.db
            .delete(leavePolicyRules)
            .where(eq(leavePolicyRules.id, ruleId))

        return { success: true }
    }
}

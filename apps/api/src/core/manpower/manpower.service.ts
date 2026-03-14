import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
    manpowerRequests,
    manpowerRequestApprovals,
    jobPostings,
    orgUnits,
    employees,
    users,
    userRoles,
    roles,
    orgUnitLeaders,
    orgUnitPositions,
} from '@hybrid-hris/db/schema';
import { ManpowerRequest } from '@hybrid-hris/db/types';
import { Tx } from 'src/database/database.types';
import { eq, and, sql, isNull, inArray, desc } from 'drizzle-orm';
import { OrgUnitsService } from '../org-units/org-units.service';
import { CreateManpowerRequestDto, ActOnManpowerRequestDto } from './dto/manpower-request.dto';
import { SystemRole, ManpowerRequestStatus } from '@hybrid-hris/domain';
import { AuditService } from '../audit/audit.service';

export interface PlantillaItem {
    orgUnitId: string;
    positionId: string;
    positionTitle: string;
    positionCode: string;
    headcountLimit: number | null;
    filledCount: number;
    vacantCount: number;
    requestedCount: number;
    approvedCount: number;
    availableCount: number;
    orgUnitName?: string;
    orgUnitCode?: string;
}

export interface ManpowerRequestListItem {
    id: string;
    orgUnitId: string;
    orgUnitName: string;
    positionId: string | null;
    jobTitle: string;
    requestType: string;
    quantity: number;
    employmentType: string;
    priority: string;
    status: string;
    requestedBy: string;
    requestedByFirstName: string | null;
    requestedByLastName: string | null;
    createdAt: Date;
    currentApproverUserId: string | null;
}

@Injectable()
export class ManpowerService {
    constructor(
        private readonly db: DatabaseService,
        private readonly orgUnitsService: OrgUnitsService,
        private readonly auditService: AuditService,
    ) { }

    async createRequest(userId: string, dto: CreateManpowerRequestDto): Promise<ManpowerRequest> {
        const [result] = await this.db.db.insert(manpowerRequests).values({
            ...dto,
            requestedBy: userId,
            status: 'DRAFT',
        }).returning();

        await this.auditService.log({
            userId,
            action: 'CREATE',
            entityType: 'ManpowerRequest',
            entityId: result.id,
            newValue: result,
        });

        return result;
    }

    async getRequestById(id: string): Promise<ManpowerRequest> {
        const [request] = await this.db.db
            .select()
            .from(manpowerRequests)
            .where(eq(manpowerRequests.id, id))
            .limit(1);

        if (!request) throw new NotFoundException('Manpower request not found');
        return request;
    }

    async updateRequest(userId: string, id: string, dto: Partial<CreateManpowerRequestDto>): Promise<ManpowerRequest> {
        const request = await this.getRequestById(id);

        if (request.requestedBy !== userId) {
            throw new ForbiddenException('Only the requester can edit this request');
        }

        if (request.status !== 'DRAFT') {
            throw new BadRequestException('Only DRAFT requests can be edited');
        }

        const [updated] = await this.db.db
            .update(manpowerRequests)
            .set({
                ...dto,
                updatedAt: new Date(),
            })
            .where(eq(manpowerRequests.id, id))
            .returning();

        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entityType: 'ManpowerRequest',
            entityId: id,
            oldValue: request,
            newValue: updated,
        });

        return updated;
    }

    async getAllRequests(filter: { 
        status?: string, 
        orgUnitId?: string,
        search?: string,
        page?: number,
        limit?: number,
        isHistory?: boolean
    }): Promise<{ items: ManpowerRequestListItem[], total: number }> {
        const page = filter.page || 1;
        const limit = filter.limit || 10;
        const offset = (page - 1) * limit;
        
        const conditions = [];

        if (filter.status) {
            conditions.push(eq(manpowerRequests.status, filter.status as ManpowerRequestStatus));
        } else if (filter.isHistory) {
            conditions.push(inArray(manpowerRequests.status, ['APPROVED', 'REJECTED', 'CANCELLED', 'CLOSED']));
        } else {
            // Default to Active
            conditions.push(inArray(manpowerRequests.status, ['DRAFT', 'SUBMITTED', 'SUBMITTED_TO_ROOT']));
        }

        if (filter.orgUnitId) {
            conditions.push(eq(manpowerRequests.orgUnitId, filter.orgUnitId));
        }

        if (filter.search) {
            conditions.push(sql`lower(${manpowerRequests.jobTitle}) LIKE ${`%${filter.search.toLowerCase()}%`}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [countResult] = await this.db.db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(manpowerRequests)
            .where(whereClause);

        const items = await this.db.db
            .select({
                id: manpowerRequests.id,
                orgUnitId: manpowerRequests.orgUnitId,
                orgUnitName: orgUnits.name,
                positionId: manpowerRequests.positionId,
                jobTitle: manpowerRequests.jobTitle,
                requestType: manpowerRequests.requestType,
                quantity: manpowerRequests.quantity,
                employmentType: manpowerRequests.employmentType,
                priority: manpowerRequests.priority,
                status: manpowerRequests.status,
                requestedBy: manpowerRequests.requestedBy,
                requestedByFirstName: employees.firstName,
                requestedByLastName: employees.lastName,
                createdAt: manpowerRequests.createdAt,
                currentApproverUserId: manpowerRequestApprovals.approverUserId,
            })
            .from(manpowerRequests)
            .innerJoin(orgUnits, eq(manpowerRequests.orgUnitId, orgUnits.id))
            .innerJoin(users, eq(manpowerRequests.requestedBy, users.id))
            .leftJoin(employees, eq(users.employeeId, employees.id))
            .leftJoin(
                manpowerRequestApprovals,
                and(
                    eq(manpowerRequestApprovals.manpowerRequestId, manpowerRequests.id),
                    eq(manpowerRequestApprovals.status, 'PENDING')
                )
            )
            .where(whereClause)
            .orderBy(desc(manpowerRequests.createdAt))
            .limit(limit)
            .offset(offset);

        return {
            items,
            total: countResult?.count || 0,
        };
    }

    /**
     * Submit a request for approval.
     * Logic: HR Admin -> Root Leader
     */
    async submitRequest(userId: string, requestId: string): Promise<{ success: boolean }> {
        const request = await this.getRequestById(requestId);

        if (request.requestedBy !== userId) {
            throw new ForbiddenException('Only the requester can submit the request');
        }

        if (request.status !== 'DRAFT') {
            throw new BadRequestException('Only DRAFT requests can be submitted');
        }

        // 1. Resolve HR Admin Approver (Level 1)
        const hrApproverId = await this.resolveHRAdminApprover();
        if (!hrApproverId) {
            throw new BadRequestException('No active HR Administrator found to approve this request');
        }

        return this.db.withTransaction(async (tx: Tx) => {
            const [updated] = await tx.update(manpowerRequests)
                .set({ status: 'SUBMITTED', updatedAt: new Date() })
                .where(eq(manpowerRequests.id, requestId))
                .returning();

            await tx.insert(manpowerRequestApprovals).values({
                manpowerRequestId: requestId,
                approverUserId: hrApproverId,
                level: 1,
                status: 'PENDING',
            });

            await this.auditService.log({
                userId,
                action: 'SUBMIT',
                entityType: 'ManpowerRequest',
                entityId: requestId,
                oldValue: request,
                newValue: updated,
            });

            return { success: true };
        });
    }

    async approveRequest(userId: string, requestId: string, dto: ActOnManpowerRequestDto): Promise<{ status: string }> {
        const request = await this.getRequestById(requestId);

        // Get the current pending approval
        const [approval] = await this.db.db
            .select()
            .from(manpowerRequestApprovals)
            .where(and(
                eq(manpowerRequestApprovals.manpowerRequestId, requestId),
                eq(manpowerRequestApprovals.status, 'PENDING')
            ))
            .orderBy(manpowerRequestApprovals.level)
            .limit(1);

        if (!approval) throw new BadRequestException('No pending approval found');
        if (approval.approverUserId !== userId) throw new ForbiddenException('You are not the assigned approver');

        return this.db.withTransaction(async (tx: Tx) => {
            // Update current level
            await tx.update(manpowerRequestApprovals)
                .set({
                    status: dto.status,
                    remarks: dto.remarks,
                    actedAt: new Date(),
                })
                .where(eq(manpowerRequestApprovals.id, approval.id));

            if (dto.status === 'REJECTED') {
                const [rejected] = await tx.update(manpowerRequests)
                    .set({ status: 'REJECTED', updatedAt: new Date() })
                    .where(eq(manpowerRequests.id, requestId))
                    .returning();

                await this.auditService.log({
                    userId,
                    action: 'REJECT',
                    entityType: 'ManpowerRequest',
                    entityId: requestId,
                    oldValue: request,
                    newValue: rejected,
                    metadata: { remarks: dto.remarks }
                });

                return { status: 'REJECTED' };
            }

            // If Level 1 (HR Admin) approved, move to Level 2 (Root Leader)
            if (approval.level === 1) {
                const rootLeaderId = await this.resolveRootLeaderApprover();
                if (!rootLeaderId || rootLeaderId === userId) {
                    // If no root leader found or HR Admin IS the root leader, auto-approve level 2
                    await this.finalizeApproval(tx, requestId, request, userId);
                    return { status: 'APPROVED' };
                }

                await tx.insert(manpowerRequestApprovals).values({
                    manpowerRequestId: requestId,
                    approverUserId: rootLeaderId,
                    level: 2,
                    status: 'PENDING',
                });

                await this.auditService.log({
                    userId,
                    action: 'APPROVE_LEVEL_1',
                    entityType: 'ManpowerRequest',
                    entityId: requestId,
                    metadata: { remarks: dto.remarks, nextApprover: rootLeaderId }
                });

                return { status: 'SUBMITTED_TO_ROOT' };
            }

            // If Level 2 approved, finalize
            await this.finalizeApproval(tx, requestId, request, userId);
            return { status: 'APPROVED' };
        });
    }

    private async finalizeApproval(tx: Tx, requestId: string, request: ManpowerRequest, actorId: string): Promise<void> {
        const [updated] = await tx.update(manpowerRequests)
            .set({ status: 'APPROVED', updatedAt: new Date() })
            .where(eq(manpowerRequests.id, requestId))
            .returning();

        // 1. If this is a NEW_HEADCOUNT request, increase the Plantilla limit
        if (request.requestType === 'NEW_HEADCOUNT' && request.positionId) {
            const [existing] = await tx
                .select()
                .from(orgUnitPositions)
                .where(and(
                    eq(orgUnitPositions.orgUnitId, request.orgUnitId),
                    eq(orgUnitPositions.positionId, request.positionId)
                ))
                .limit(1);

            if (existing) {
                await tx.update(orgUnitPositions)
                    .set({ 
                        headcountLimit: (existing.headcountLimit ?? 0) + request.quantity
                    })
                    .where(eq(orgUnitPositions.id, existing.id));
            } else {
                await tx.insert(orgUnitPositions).values({
                    orgUnitId: request.orgUnitId,
                    positionId: request.positionId,
                    headcountLimit: request.quantity,
                    isActive: true,
                });
            }
        }

        // 2. Create a Job Posting automatically as DRAFT
        const slug = `${request.jobTitle.toLowerCase().replace(/ /g, '-')}-${requestId.slice(0, 8)}`;

        await tx.insert(jobPostings).values({
            manpowerRequestId: requestId,
            title: request.jobTitle,
            slug,
            employmentType: request.employmentType,
            description: request.jobDescription || 'No description provided',
            responsibilities: request.responsibilities,
            qualifications: request.qualifications,
            status: 'DRAFT',
        });

        await this.auditService.log({
            userId: actorId,
            action: 'APPROVE_FINAL',
            entityType: 'ManpowerRequest',
            entityId: requestId,
            oldValue: request,
            newValue: updated,
        });
    }
    private async resolveHRAdminApprover(): Promise<string | null> {
        // Find a user with HR_ADMIN role who is active
        const [hrUser] = await this.db.db
            .select({ userId: users.id })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .innerJoin(users, eq(users.id, userRoles.userId))
            .where(and(
                eq(roles.code, SystemRole.HR_ADMIN),
                eq(users.isActive, true)
            ))
            .limit(1);

        return hrUser?.userId || null;
    }

    private async resolveRootLeaderApprover(): Promise<string | null> {
        // Find the root org
        const [rootOrg] = await this.db.db
            .select({ id: orgUnits.id })
            .from(orgUnits)
            .where(isNull(orgUnits.parentId))
            .limit(1);

        if (!rootOrg) return null;

        // Find the leader of the root org
        const [leader] = await this.db.db
            .select({ userId: users.id })
            .from(orgUnitLeaders)
            .innerJoin(users, eq(users.employeeId, orgUnitLeaders.employeeId))
            .where(and(
                eq(orgUnitLeaders.orgUnitId, rootOrg.id),
                isNull(orgUnitLeaders.deletedAt),
                eq(users.isActive, true)
            ))
            .limit(1);

        return leader?.userId || null;
    }

    /**
     * Detailed plantilla inventory for a single org unit with pending counts
     */
    async getPlantillaInventory(orgUnitId: string): Promise<PlantillaItem[]> {
        // 1. Get base plantilla from OrgUnitsService (contains limit and filled)
        const baseInventory = await this.orgUnitsService.getPlantillaInventory(orgUnitId);

        // 2. Get manpower request counts for this org unit
        const requests = await this.db.db
            .select({
                positionId: manpowerRequests.positionId,
                status: manpowerRequests.status,
                quantity: manpowerRequests.quantity,
            })
            .from(manpowerRequests)
            .where(and(
                eq(manpowerRequests.orgUnitId, orgUnitId),
                inArray(manpowerRequests.status, ['SUBMITTED', 'APPROVED', 'SUBMITTED_TO_ROOT'])
            ));

        // 3. Map requests to position IDs
        const requestMap = new Map<string, { requested: number; approved: number }>();
        requests.forEach(r => {
            const posId = r.positionId;
            if (!posId) return;
            const current = requestMap.get(posId) || { requested: 0, approved: 0 };
            if (r.status === 'SUBMITTED' || r.status === 'SUBMITTED_TO_ROOT') {
                current.requested += r.quantity;
            } else if (r.status === 'APPROVED') {
                current.approved += r.quantity;
            }
            requestMap.set(posId, current);
        });

        // 4. Augment base inventory
        return baseInventory.map(item => {
            const counts = requestMap.get(item.positionId) || { requested: 0, approved: 0 };
            const limit = Number(item.headcountLimit) || 0;
            const filled = Number(item.filledCount) || 0;
            
            return {
                ...item,
                requestedCount: counts.requested,
                approvedCount: counts.approved,
                availableCount: Math.max(0, limit - filled - counts.requested - counts.approved),
            };
        });
    }

    /**
     * Aggregate plantilla summary (Total Headcount vs Total Filled) 
     * for an org unit and all its children.
     */
    async getPlantillaOverview(orgUnitId: string): Promise<{ 
        totalLimit: number; 
        totalFilled: number; 
        totalRequested: number; 
        totalApproved: number; 
        totalAvailable: number 
    }> {
        const descendantIds = await this.orgUnitsService.getDescendantOrgUnitIds([orgUnitId]);
        const allIds = [orgUnitId, ...descendantIds];

        // 1. Sum up headcount limits from all units
        const [limitResult] = await this.db.db
            .select({ total: sql<number>`SUM(headcount_limit)` })
            .from(orgUnitPositions)
            .where(and(
                inArray(orgUnitPositions.orgUnitId, allIds),
                eq(orgUnitPositions.isActive, true)
            ));

        // 2. Count active employees in all units
        const [filledResult] = await this.db.db
            .select({ total: sql<number>`count(*)` })
            .from(employees)
            .where(and(
                inArray(employees.orgUnitId, allIds),
                isNull(employees.deletedAt),
                eq(employees.status, 'ACTIVE')
            ));

        // 3. Count pending/approved manpower requests
        const requestResults = await this.db.db
            .select({ 
                status: manpowerRequests.status,
                quantity: sql<number>`SUM(quantity)`
            })
            .from(manpowerRequests)
            .where(and(
                inArray(manpowerRequests.orgUnitId, allIds),
                inArray(manpowerRequests.status, ['SUBMITTED', 'APPROVED', 'SUBMITTED_TO_ROOT'])
            ))
            .groupBy(manpowerRequests.status);

        let requested = 0;
        let approved = 0;
        
        requestResults.forEach(r => {
            if (r.status === 'SUBMITTED' || r.status === 'SUBMITTED_TO_ROOT') {
                requested += Number(r.quantity || 0);
            } else if (r.status === 'APPROVED') {
                approved += Number(r.quantity || 0);
            }
        });

        const totalLimit = Number(limitResult?.total || 0);
        const totalFilled = Number(filledResult?.total || 0);

        return {
            totalLimit,
            totalFilled,
            totalRequested: requested,
            totalApproved: approved,
            totalAvailable: Math.max(0, totalLimit - totalFilled - requested - approved),
        };
    }

    async getFlatPlantilla(): Promise<PlantillaItem[]> {
        // Get all org units
        const units = await this.orgUnitsService.getFlat(false);
        
        const results: PlantillaItem[] = [];
        
        // Use for-of for cleaner async loop
        for (const u of units) {
             const inventory = await this.getPlantillaInventory(u.id);
             for (const item of inventory) {
                 results.push({
                     ...item,
                     orgUnitName: u.name,
                     orgUnitCode: u.code
                 });
             }
        }
        
        return results;
    }
}

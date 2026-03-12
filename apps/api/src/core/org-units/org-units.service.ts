import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { orgUnits, employees, positions, orgUnitPositions, orgUnitLeaders } from '@hybrid-hris/db/schema'

type OrgUnit = InferSelectModel<typeof orgUnits>

export interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[]
  isDeletable: boolean
}

@Injectable()
export class OrgUnitsService {
  constructor(private readonly db: DatabaseService) { }

  async getFlat(showDeleted = false, leavesOnly = false, search?: string): Promise<OrgUnit[]> {
    let query = this.db.db.select().from(orgUnits).$dynamic();
    
    const conditions = [];
    if (!showDeleted) conditions.push(isNull(orgUnits.deletedAt));
    if (search) conditions.push(sql`lower(${orgUnits.name}) LIKE ${'%' + search.toLowerCase() + '%'}`);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const units = await query.orderBy(asc(orgUnits.name));

    if (!leavesOnly) {
      return units
    }

    const parentIds = new Set<string>()
    for (const u of units) {
      if (u.parentId) {
        parentIds.add(u.parentId)
      }
    }

    return units.filter(u => !parentIds.has(u.id))
  }

  async getTree(showDeleted = false): Promise<OrgUnitNode[]> {
    const units: OrgUnit[] = await this.getFlat(showDeleted)

    const employeeCounts = await this.db.db
      .select({
        orgUnitId: employees.orgUnitId,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .where(isNull(employees.deletedAt))
      .groupBy(employees.orgUnitId)

    const employeeMap = new Map<string, number>()
    for (const row of employeeCounts) {
      if (row.orgUnitId) {
        employeeMap.set(row.orgUnitId, Number(row.count))
      }
    }

    const map = new Map<string, OrgUnitNode>()
    const roots: OrgUnitNode[] = []

    for (const unit of units) {
      map.set(unit.id, { ...unit, children: [], isDeletable: true })
    }

    for (const unit of map.values()) {
      if (unit.parentId) {
        const parent = map.get(unit.parentId)
        if (parent) parent.children.push(unit)
      } else {
        roots.push(unit)
      }
    }

    for (const node of map.values()) {
      const hasChildren = node.children.length > 0
      const hasEmployees = (employeeMap.get(node.id) ?? 0) > 0
      const isRoot = node.parentId === null

      node.isDeletable = !hasChildren && !hasEmployees && !isRoot
    }

    return roots
  }

  async getById(id: string) {
    const result = await this.db.db
      .select()
      .from(orgUnits)
      .where(and(eq(orgUnits.id, id), isNull(orgUnits.deletedAt)))
      .limit(1)

    return result[0] ?? null
  }

  async createOrgUnit(data: {
    name: string
    code: string
    parentId?: string | null
  }): Promise<OrgUnit> {
    const inserted = await this.db.db
      .insert(orgUnits)
      .values({
        name: data.name,
        code: data.code,
        parentId: data.parentId ?? null,
      })
      .returning()

    return inserted[0]
  }

  async updateOrgUnit(
    id: string,
    data: {
      name?: string
      code?: string
      parentId?: string | null
      isActive?: boolean
    },
  ): Promise<OrgUnit> {
    const existing = await this.getById(id)
    if (!existing) throw new NotFoundException('Org unit not found')

    const updated = await this.db.db
      .update(orgUnits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orgUnits.id, id))
      .returning()

    return updated[0]
  }

  async softDeleteOrgUnit(id: string): Promise<{ success: true }> {
    const existing = await this.getById(id)
    if (!existing) throw new NotFoundException('Org unit not found')

    const children = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.parentId, id))
      .limit(1)

    if (children.length) {
      throw new BadRequestException('Cannot delete org unit with child units')
    }

    await this.db.db
      .update(orgUnits)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(orgUnits.id, id))

    return { success: true }
  }

  async restoreOrgUnit(id: string): Promise<{ success: true }> {
    const existing = await this.db.db
      .select()
      .from(orgUnits)
      .where(eq(orgUnits.id, id))
      .limit(1)

    if (!existing.length) {
      throw new NotFoundException('Org unit not found')
    }

    await this.db.db
      .update(orgUnits)
      .set({ deletedAt: null, isActive: true, updatedAt: new Date() })
      .where(eq(orgUnits.id, id))

    return { success: true }
  }

  async getPositionsForOrg(orgUnitId: string) {
    const existing = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.id, orgUnitId))
      .limit(1)

    if (!existing.length) {
      throw new NotFoundException('Org unit not found')
    }

    return this.db.db
      .select({
        id: positions.id,
        code: positions.code,
        title: positions.title,
        description: positions.description,
        isActive: positions.isActive,
      })
      .from(orgUnitPositions)
      .innerJoin(positions, eq(orgUnitPositions.positionId, positions.id))
      .where(eq(orgUnitPositions.orgUnitId, orgUnitId))
      .orderBy(asc(positions.title))
  }

  async addPositionToOrg(orgUnitId: string, positionId: string): Promise<{ success: true }> {
    const [org] = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.id, orgUnitId))
      .limit(1)

    if (!org) throw new NotFoundException('Org unit not found')

    const [position] = await this.db.db
      .select({ id: positions.id })
      .from(positions)
      .where(eq(positions.id, positionId))
      .limit(1)

    if (!position) throw new NotFoundException('Position not found')

    await this.db.db
      .insert(orgUnitPositions)
      .values({ orgUnitId, positionId })
      .onConflictDoNothing()

    return { success: true }
  }

  async removePositionFromOrg(orgUnitId: string, positionId: string): Promise<{ success: true }> {
    await this.db.db
      .delete(orgUnitPositions)
      .where(
        and(
          eq(orgUnitPositions.orgUnitId, orgUnitId),
          eq(orgUnitPositions.positionId, positionId),
        ),
      )

    return { success: true }
  }

  async searchLeafOrgUnits(search?: string, limit = 20) {
    const units = await this.db.db
      .select()
      .from(orgUnits)
      .where(isNull(orgUnits.deletedAt))

    const unitById = new Map<string, OrgUnit>()
    for (const u of units) {
      unitById.set(u.id, u)
    }

    const buildPath = (unit: OrgUnit): string => {
      const parts: string[] = []
      let current: OrgUnit | undefined = unit

      while (current) {
        parts.unshift(current.name)
        if (!current.parentId) break
        current = unitById.get(current.parentId)
      }

      return parts.join(' / ')
    }

    const parentIds = new Set<string>()
    for (const u of units) {
      if (u.parentId) {
        parentIds.add(u.parentId)
      }
    }

    let leaves = units.filter((u) => !parentIds.has(u.id))

    if (search && search.trim().length > 0) {
      const keyword = search.trim().toLowerCase()
      leaves = leaves.filter((u) => {
        const name = u.name.toLowerCase()
        const path = buildPath(u).toLowerCase()
        return name.includes(keyword) || path.includes(keyword)
      })
    }

    return leaves
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((u) => ({
        id: u.id,
        name: u.name,
        parentId: u.parentId,
        path: buildPath(u),
      }))
  }

  /* ── Leaders ─────────────────────────────────────────────────────────────── */

  async updatePositionLimit(orgUnitId: string, positionId: string, limit: number) {
      if (limit < 0) throw new BadRequestException('Limit cannot be negative');

      await this.db.db
          .update(orgUnitPositions)
          .set({ 
              headcountLimit: limit
          })
          .where(and(
              eq(orgUnitPositions.orgUnitId, orgUnitId),
              eq(orgUnitPositions.positionId, positionId)
          ));

      return { success: true };
  }

  async getLeaders(orgUnitId: string) {    const [org] = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.id, orgUnitId))
      .limit(1)

    if (!org) throw new NotFoundException('Org unit not found')

    return this.db.db
      .select({
        id: orgUnitLeaders.id,
        employeeId: orgUnitLeaders.employeeId,
        firstName: employees.firstName,
        lastName: employees.lastName,
        role: orgUnitLeaders.role,
        isPrimary: orgUnitLeaders.isPrimary,
        effectiveFrom: orgUnitLeaders.effectiveFrom,
        effectiveTo: orgUnitLeaders.effectiveTo,
      })
      .from(orgUnitLeaders)
      .innerJoin(employees, eq(orgUnitLeaders.employeeId, employees.id))
      .where(
        and(
          eq(orgUnitLeaders.orgUnitId, orgUnitId),
          isNull(orgUnitLeaders.deletedAt),
          isNull(employees.deletedAt),
        ),
      )
      .orderBy(asc(orgUnitLeaders.effectiveFrom))
  }

  async addLeader(
    orgUnitId: string,
    data: {
      employeeId: string
      role: 'HEAD' | 'CO_HEAD' | 'ACTING_HEAD'
      isPrimary?: boolean
      effectiveFrom?: string
    },
  ): Promise<{ success: true }> {
    const [org] = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.id, orgUnitId))
      .limit(1)

    if (!org) throw new NotFoundException('Org unit not found')

    const [emp] = await this.db.db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, data.employeeId), isNull(employees.deletedAt)))
      .limit(1)

    if (!emp) throw new NotFoundException('Employee not found')

    const today = new Date().toISOString().split('T')[0]

    await this.db.db.insert(orgUnitLeaders).values({
      orgUnitId,
      employeeId: data.employeeId,
      role: data.role,
      isPrimary: data.isPrimary ?? false,
      effectiveFrom: data.effectiveFrom ?? today,
    })

    return { success: true }
  }

  async removeLeader(orgUnitId: string, leaderId: string): Promise<{ success: true }> {
    const [existing] = await this.db.db
      .select({ id: orgUnitLeaders.id })
      .from(orgUnitLeaders)
      .where(
        and(
          eq(orgUnitLeaders.id, leaderId),
          eq(orgUnitLeaders.orgUnitId, orgUnitId),
          isNull(orgUnitLeaders.deletedAt),
        ),
      )
      .limit(1)

    if (!existing) throw new NotFoundException('Leader assignment not found')

    await this.db.db
      .update(orgUnitLeaders)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(orgUnitLeaders.id, leaderId))

    return { success: true }
  }

  /* ── Members ─────────────────────────────────────────────────────────────── */

  async getMembers(orgUnitId: string) {
    const [org] = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.id, orgUnitId))
      .limit(1)

    if (!org) throw new NotFoundException('Org unit not found')

    // Step 1: fetch all active employees in this org unit with their position title
    const memberRows = await this.db.db
      .select({
        id: employees.id,
        employeeNo: employees.employeeNo,
        firstName: employees.firstName,
        lastName: employees.lastName,
        status: employees.status,
        positionTitle: positions.title,
        supervisorId: employees.supervisorId,
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(
        and(
          eq(employees.orgUnitId, orgUnitId),
          isNull(employees.deletedAt),
        ),
      )
      .orderBy(asc(employees.lastName), asc(employees.firstName))

    // Step 2: bulk-fetch supervisor names
    const supervisorIds = [
      ...new Set(memberRows.map((m) => m.supervisorId).filter(Boolean)),
    ] as string[]

    const supervisorMap = new Map<string, { firstName: string; lastName: string }>()

    if (supervisorIds.length > 0) {
      const supRows = await this.db.db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
        })
        .from(employees)
        .where(inArray(employees.id, supervisorIds))

      for (const s of supRows) {
        supervisorMap.set(s.id, { firstName: s.firstName, lastName: s.lastName })
      }
    }

    return memberRows.map((m) => ({
      id: m.id,
      employeeNo: m.employeeNo,
      firstName: m.firstName,
      lastName: m.lastName,
      status: m.status,
      positionTitle: m.positionTitle ?? null,
      supervisorId: m.supervisorId ?? null,
      supervisorFirstName: m.supervisorId ? (supervisorMap.get(m.supervisorId)?.firstName ?? null) : null,
      supervisorLastName: m.supervisorId ? (supervisorMap.get(m.supervisorId)?.lastName ?? null) : null,
    }))
  }

  async isRootLeader(employeeId: string): Promise<boolean> {
    // 1. Find root org (parentId is null)
    const [root] = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(isNull(orgUnits.parentId))
      .limit(1);
    
    if (!root) return false;

    // 2. Check if this employee is an active leader of that root org
    const [leader] = await this.db.db
      .select({ id: orgUnitLeaders.id })
      .from(orgUnitLeaders)
      .where(and(
        eq(orgUnitLeaders.orgUnitId, root.id),
        eq(orgUnitLeaders.employeeId, employeeId),
        isNull(orgUnitLeaders.deletedAt)
      ))
      .limit(1);

    return !!leader;
    }

    /**
    * Recursively fetches all descendant Org Unit IDs for a given set of parent IDs using a recursive CTE.
    */
    async getDescendantOrgUnitIds(parentIds: string[]): Promise<string[]> {
        if (parentIds.length === 0) return [];

        const result = await this.db.db.execute(sql`
            WITH RECURSIVE subordinates AS (
                SELECT id FROM org_units WHERE id IN (${sql.join(parentIds.map(id => sql`${id}`), sql`, `)})
                UNION ALL
                SELECT ou.id FROM org_units ou
                INNER JOIN subordinates s ON ou.parent_id = s.id
                WHERE ou.deleted_at IS NULL
            )
            SELECT id FROM subordinates WHERE id NOT IN (${sql.join(parentIds.map(id => sql`${id}`), sql`, `)})
        `);

        return (result.rows as { id: string }[]).map(row => row.id);
    }

    /**
    * Fetches all employee IDs who are leaders of the specified Org Units.
    */
    async getOrgUnitLeaderEmployeeIds(orgUnitIds: string[]): Promise<string[]> {
    if (orgUnitIds.length === 0) return [];

    const leaders = await this.db.db
      .select({ employeeId: orgUnitLeaders.employeeId })
      .from(orgUnitLeaders)
      .where(and(
        inArray(orgUnitLeaders.orgUnitId, orgUnitIds),
        isNull(orgUnitLeaders.deletedAt)
      ));

    return leaders.map(l => l.employeeId);
    }

    async getPlantillaInventory(orgUnitId: string) {
        // 1. Get all positions assigned to this org unit
        const plantilla = await this.db.db
            .select({
                orgUnitId: orgUnitPositions.orgUnitId,
                positionId: orgUnitPositions.positionId,
                positionTitle: positions.title,
                positionCode: positions.code,
                headcountLimit: orgUnitPositions.headcountLimit,
            })
            .from(orgUnitPositions)
            .innerJoin(positions, eq(orgUnitPositions.positionId, positions.id))
            .where(and(
                eq(orgUnitPositions.orgUnitId, orgUnitId),
                eq(orgUnitPositions.isActive, true)
            ));

        // 2. Get active employee counts per position in this org unit
        const filledCounts = await this.db.db
            .select({
                positionId: employees.positionId,
                count: sql<number>`count(${employees.id})`,
            })
            .from(employees)
            .where(and(
                eq(employees.orgUnitId, orgUnitId),
                isNull(employees.deletedAt),
                eq(employees.status, 'ACTIVE')
            ))
            .groupBy(employees.positionId);

        const filledMap = new Map(filledCounts.map(f => [f.positionId, Number(f.count)]));

        // 3. Combine
        return plantilla.map(p => {
            const filled = filledMap.get(p.positionId) || 0;
            const limit = p.headcountLimit || 0;
            return {
                ...p,
                filledCount: filled,
                vacantCount: Math.max(0, limit - filled),
            };
        });
    }
    }
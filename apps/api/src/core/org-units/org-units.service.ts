import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { orgUnits, employees, positions, orgUnitPositions } from '@hybrid-hris/db/schema'

type OrgUnit = InferSelectModel<typeof orgUnits>

interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[]
  isDeletable: boolean
}

@Injectable()
export class OrgUnitsService {
  constructor(private readonly db: DatabaseService) { }

  async getFlat(showDeleted = false, leavesOnly = false): Promise<OrgUnit[]> {
    const units = showDeleted
      ? await this.db.db
        .select()
        .from(orgUnits)
        .orderBy(asc(orgUnits.name))
      : await this.db.db
        .select()
        .from(orgUnits)
        .where(isNull(orgUnits.deletedAt))
        .orderBy(asc(orgUnits.name))

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
}
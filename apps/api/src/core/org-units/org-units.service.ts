import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { orgUnits } from '@hybrid-hris/db/schema';
import { employees } from '@hybrid-hris/db/schema';

type OrgUnit = InferSelectModel<typeof orgUnits>;

interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[];
  isDeletable: boolean;
}

@Injectable()
export class OrgUnitsService {
  constructor(private readonly db: DatabaseService) { }

  async getFlat(showDeleted = false): Promise<OrgUnit[]> {
    if (!showDeleted) {
      return this.db.db
        .select()
        .from(orgUnits)
        .where(isNull(orgUnits.deletedAt))
        .orderBy(asc(orgUnits.name));
    }

    return this.db.db
      .select()
      .from(orgUnits)
      .orderBy(asc(orgUnits.name));
  }

  async getTree(showDeleted = false): Promise<OrgUnitNode[]> {
    const units: OrgUnit[] = await this.getFlat(showDeleted);

    // Fetch employee counts per org unit
    const employeeCounts = await this.db.db
      .select({
        orgUnitId: employees.orgUnitId,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .where(isNull(employees.deletedAt))
      .groupBy(employees.orgUnitId);

    const employeeMap = new Map<string, number>();
    for (const row of employeeCounts) {
      if (row.orgUnitId) {
        employeeMap.set(row.orgUnitId, Number(row.count));
      }
    }

    const map = new Map<string, OrgUnitNode>();
    const roots: OrgUnitNode[] = [];

    for (const unit of units) {
      map.set(unit.id, {
        ...unit,
        children: [],
        isDeletable: true,
      });
    }

    for (const unit of map.values()) {
      if (unit.parentId) {
        const parent = map.get(unit.parentId);
        if (parent) parent.children.push(unit);
      } else {
        roots.push(unit);
      }
    }

    // Compute deletable flag
    for (const node of map.values()) {
      const hasChildren = node.children.length > 0;
      const hasEmployees = (employeeMap.get(node.id) ?? 0) > 0;

      // Root cannot be deleted (single-tree rule)
      const isRoot = node.parentId === null;

      node.isDeletable = !hasChildren && !hasEmployees && !isRoot;
    }

    return roots;
  }

  async getById(id: string) {
    const idCol = orgUnits.id;
    const deletedAt = orgUnits.deletedAt;

    const result = await this.db.db
      .select()
      .from(orgUnits)
      .where(
        and(
          eq(idCol, id),
          isNull(deletedAt),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async createOrgUnit(data: {
    name: string;
    code: string;
    parentId?: string | null;
  }): Promise<OrgUnit> {
    const inserted = await this.db.db
      .insert(orgUnits)
      .values({
        name: data.name,
        code: data.code,
        parentId: data.parentId ?? null,
      })
      .returning();

    return inserted[0];
  }

  async updateOrgUnit(
    id: string,
    data: {
      name?: string;
      code?: string;
      parentId?: string | null;
      isActive?: boolean;
    },
  ): Promise<OrgUnit> {
    const existing = await this.getById(id);
    if (!existing) throw new NotFoundException('Org unit not found');

    const updated = await this.db.db
      .update(orgUnits)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(orgUnits.id, id))
      .returning();

    return updated[0];
  }

  async softDeleteOrgUnit(id: string): Promise<{ success: true }> {
    const existing = await this.getById(id);
    if (!existing) throw new NotFoundException('Org unit not found');

    // Prevent delete if has children
    const children = await this.db.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.parentId, id))
      .limit(1);

    if (children.length) {
      throw new BadRequestException('Cannot delete org unit with child units');
    }

    await this.db.db
      .update(orgUnits)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(orgUnits.id, id));

    return { success: true };
  }
  async restoreOrgUnit(id: string): Promise<{ success: true }> {
    const existing = await this.db.db
      .select()
      .from(orgUnits)
      .where(eq(orgUnits.id, id))
      .limit(1);

    if (!existing.length) {
      throw new NotFoundException('Org unit not found');
    }

    await this.db.db
      .update(orgUnits)
      .set({
        deletedAt: null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(orgUnits.id, id));

    return { success: true };
  }
}
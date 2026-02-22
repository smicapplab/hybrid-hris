import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";

import { and, asc, eq, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { orgUnits } from '@hybrid-hris/db/schema';

type OrgUnit = InferSelectModel<typeof orgUnits>;

interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[];
}

@Injectable()
export class OrgUnitsService {
  constructor(private readonly db: DatabaseService) { }

  async getFlat(): Promise<OrgUnit[]> {
    const deletedAt = orgUnits.deletedAt;
    const nameCol = orgUnits.name;

    return this.db.db
      .select()
      .from(orgUnits)
      .where(isNull(deletedAt))
      .orderBy(asc(nameCol));
  }

  async getTree(): Promise<OrgUnitNode[]> {
    const units: OrgUnit[] = await this.getFlat();

    const map = new Map<string, OrgUnitNode>();
    const roots: OrgUnitNode[] = [];

    for (const unit of units) {
      map.set(unit.id, { ...unit, children: [] });
    }

    for (const unit of map.values()) {
      if (unit.parentId) {
        const parent = map.get(unit.parentId);
        if (parent) parent.children.push(unit);
      } else {
        roots.push(unit);
      }
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
}
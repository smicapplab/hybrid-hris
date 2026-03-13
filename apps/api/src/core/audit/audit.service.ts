import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { auditLogs } from '@hybrid-hris/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export interface LogOptions {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async log(options: LogOptions) {
    try {
      await this.db.db.insert(auditLogs).values({
        userId: options.userId ?? null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? null,
        oldValue: options.oldValue ?? null,
        newValue: options.newValue ?? null,
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        metadata: options.metadata ?? null,
      });
    } catch (err) {
      // We don't want audit logging to crash the main transaction/operation
      console.error('Failed to write audit log:', err);
    }
  }

  async getLogs(options: { 
    entityType?: string; 
    entityId?: string; 
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { entityType, entityId, userId, limit = 50, offset = 0 } = options;
    
    const whereClauses = [];
    if (entityType) whereClauses.push(eq(auditLogs.entityType, entityType));
    if (entityId) whereClauses.push(eq(auditLogs.entityId, entityId));
    if (userId) whereClauses.push(eq(auditLogs.userId, userId));

    const [countResult] = await this.db.db
      .select({ count: sql<number>`cast(count(${auditLogs.id}) as int)` })
      .from(auditLogs)
      .where(and(...whereClauses));

    const logs = await this.db.db
      .select()
      .from(auditLogs)
      .where(and(...whereClauses))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: logs,
      total: countResult?.count ?? 0,
      hasMore: offset + limit < (countResult?.count ?? 0)
    };
  }
}

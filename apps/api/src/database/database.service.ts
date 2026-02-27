import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '@hybrid-hris/db/schema'
import type { Tx } from './database.types'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool
  public readonly db: NodePgDatabase<typeof schema>

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL as string,
    })

    this.db = drizzle(this.pool, { schema })
  }

  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(fn)
  }

  async onModuleDestroy() {
    await this.pool.end()
  }
}
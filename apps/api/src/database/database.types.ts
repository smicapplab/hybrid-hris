import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '@hybrid-hris/db/schema'

export type Db = NodePgDatabase<typeof schema>

export type Tx = Parameters<Db['transaction']>[0] extends (
    tx: infer T,
) => unknown ? T : never

export type DbOrTx = Db | Tx
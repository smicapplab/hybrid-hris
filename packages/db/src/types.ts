import type { InferSelectModel } from 'drizzle-orm'
import { orgUnits } from './schema/org-units'
import { positions } from './schema/positions'

export type OrgUnit = InferSelectModel<typeof orgUnits>
export type Position = InferSelectModel<typeof positions>
import type { InferSelectModel } from 'drizzle-orm'
import { orgUnits } from './schema/org-units'

export type OrgUnit = InferSelectModel<typeof orgUnits>
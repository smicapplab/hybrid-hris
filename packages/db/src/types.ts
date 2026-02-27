import type { InferSelectModel } from 'drizzle-orm'
import { orgUnits } from './schema/org-units'
import { positions } from './schema/positions'
import { employeeIdentifiers, employeeProfiles, employees } from './schema'

export type OrgUnit = InferSelectModel<typeof orgUnits>
export type Position = InferSelectModel<typeof positions>
export type Employee = InferSelectModel<typeof employees>
export type EmployeeIdentifier = InferSelectModel<typeof employeeIdentifiers>
export type EmployeeProfile = InferSelectModel<typeof employeeProfiles>
import type { Position as BasePosition } from '@hybrid-hris/db/types'

export type Position = BasePosition & {
    isDeletable: boolean
}

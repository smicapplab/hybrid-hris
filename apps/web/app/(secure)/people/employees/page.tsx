'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { CreateEmployeeDialog } from './components/create-employee-dialog'
import { STATUS_CONFIG } from '@/app/(secure)/people/employees/config'
import { Employee } from '@/types/employee.type'
import { format } from 'date-fns'

type SortBy = 'firstName' | 'lastName' | 'hireDate' | 'status'
type SortOrder = 'asc' | 'desc'

type Meta = {
    total: number
    page: number
    pageSize: number
    totalPages: number
}

type Params = {
    search: string
    showInactive: boolean
    sortBy: SortBy
    sortOrder: SortOrder
    page: number
}

const ACTIVE_STATUSES = ['ACTIVE', 'PROBATION']

function formatStatus(status: string) {
    return status.charAt(0) + status.slice(1).toLowerCase()
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
    if (!active) return <ChevronsUpDownIcon className="ml-1 inline h-3.5 w-3.5 text-muted-foreground" />
    return order === 'asc'
        ? <ChevronUpIcon className="ml-1 inline h-3.5 w-3.5" />
        : <ChevronDownIcon className="ml-1 inline h-3.5 w-3.5" />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeeListPage() {
    const { user } = useAuth()
    const router = useRouter()

    const [rows, setRows] = useState<Employee[]>([])
    const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 })
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    const [inputSearch, setInputSearch] = useState('')
    const [params, setParams] = useState<Params>({
        search: '',
        showInactive: false,
        sortBy: 'lastName',
        sortOrder: 'asc',
        page: 1,
    })

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Debounce search input → update params (reset to page 1)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setParams((p) => ({ ...p, search: inputSearch, page: 1 }))
        }, 300)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [inputSearch])

    const load = useCallback(async (p: Params) => {
        setLoading(true)
        try {
            const qs = new URLSearchParams()
            if (p.search) qs.set('search', p.search)
            if (!p.showInactive) {
                ACTIVE_STATUSES.forEach((s) => qs.append('status', s))
            }
            qs.set('sortBy', p.sortBy)
            qs.set('sortOrder', p.sortOrder)
            qs.set('page', String(p.page))
            qs.set('pageSize', '20')

            const result = await apiFetch<{ data: Employee[]; meta: Meta }>(
                `/employees?${qs.toString()}`,
            )
            setRows(result.data)
            setMeta(result.meta)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!user) return
        load(params)
    }, [params, user, load])

    function handleSort(col: SortBy) {
        setParams((p) => ({
            ...p,
            sortBy: col,
            sortOrder: p.sortBy === col && p.sortOrder === 'asc' ? 'desc' : 'asc',
            page: 1,
        }))
    }

    if (!user) return null

    return (
        <>
            <div className="p-6 space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Employees</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            {meta.total} {meta.total === 1 ? 'employee' : 'employees'}
                        </span>
                        <Button size="sm" onClick={() => setDialogOpen(true)}>
                            <PlusIcon className="mr-1.5 h-4 w-4" />
                            Create Employee
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search by name..."
                        value={inputSearch}
                        onChange={(e) => setInputSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <Switch
                            size="sm"
                            checked={params.showInactive}
                            onCheckedChange={(checked) =>
                                setParams((p) => ({ ...p, showInactive: checked, page: 1 }))
                            }
                        />
                        Show inactive
                    </label>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer select-none"
                                    onClick={() => handleSort('lastName')}
                                >
                                    Name
                                    <SortIcon active={params.sortBy === 'lastName'} order={params.sortOrder} />
                                </TableHead>
                                <TableHead>Employee No</TableHead>
                                <TableHead
                                    className="cursor-pointer select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    Status
                                    <SortIcon active={params.sortBy === 'status'} order={params.sortOrder} />
                                </TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead
                                    className="cursor-pointer select-none"
                                    onClick={() => handleSort('hireDate')}
                                >
                                    Hire Date
                                    <SortIcon active={params.sortBy === 'hireDate'} order={params.sortOrder} />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    onClick={() => router.push(`/people/employees/${row.id}`)}
                                >
                                    <TableCell className="font-medium">
                                        {row.firstName} {row.lastName}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {row.employeeNo}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const statusCfg = STATUS_CONFIG[row.status]
                                            if (!statusCfg) {
                                                return (
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                                                        {formatStatus(row.status)}
                                                    </span>
                                                )
                                            }
                                            return (
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                    {statusCfg.label}
                                                </span>
                                            )
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {row.positionTitle ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {row.orgUnitName ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(row.hireDate), 'PP')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {meta.totalPages > 1
                            ? `Page ${meta.page} of ${meta.totalPages}`
                            : `${meta.total} result${meta.total === 1 ? '' : 's'}`}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={params.page <= 1 || loading}
                            onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={params.page >= meta.totalPages || loading}
                            onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
                        >
                            Next
                        </Button>
                    </div>
                </div>

            </div>

            <CreateEmployeeDialog
                open={dialogOpen}
                onOpenChangeAction={setDialogOpen}
            />
        </>
    )
}

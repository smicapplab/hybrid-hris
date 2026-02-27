import { employees } from '@hybrid-hris/db'
import { Type, Transform } from 'class-transformer'
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

type EmployeeStatus = (typeof employees.status.enumValues)[number]

export class EmployeeFilterDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positionIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orgUnitIds?: string[]

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null) return undefined

    if (Array.isArray(value)) {
      return value as EmployeeStatus[]
    }

    return [value as EmployeeStatus]
  })
  @IsArray()
  @IsEnum(employees.status.enumValues, { each: true })
  status?: EmployeeStatus[]

  @IsOptional()
  @Type(() => Boolean)
  showDeleted?: boolean

  @IsOptional()
  @IsString()
  sortBy?: 'firstName' | 'lastName' | 'hireDate' | 'status'

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20
}
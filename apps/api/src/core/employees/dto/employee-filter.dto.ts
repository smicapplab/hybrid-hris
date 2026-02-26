import { employees } from '@hybrid-hris/db'
import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

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
  @IsArray()
  @IsEnum(employees.status.enumValues, { each: true })
  status?: (typeof employees.status.enumValues)[number][]

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
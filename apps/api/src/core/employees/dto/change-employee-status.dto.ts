import { employeeStatusEnum } from "@hybrid-hris/db";
import { IsEnum } from "class-validator";

export class ChangeEmployeeStatusDto {
    @IsEnum(employeeStatusEnum.enumValues)
    status!: typeof employeeStatusEnum.enumValues[number]
}
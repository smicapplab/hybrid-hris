import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ComponentDto {
    @IsUUID()
    payrollComponentId!: string;

    @IsString()
    amount!: string;
}

export class CreateCompensationTemplateDto {
    @IsString()
    code!: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    jobLevelId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => ComponentDto)
    components!: ComponentDto[];
}

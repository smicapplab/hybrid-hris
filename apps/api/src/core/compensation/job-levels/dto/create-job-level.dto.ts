import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateJobLevelDto {
    @IsString()
    @MaxLength(50)
    code!: string;

    @IsString()
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    @Min(1)
    rankOrder!: number;
}

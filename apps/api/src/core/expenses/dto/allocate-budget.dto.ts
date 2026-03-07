import { IsNotEmpty, IsUUID, IsNumberString } from 'class-validator';

export class AllocateBudgetDto {
    @IsUUID()
    @IsNotEmpty()
    orgUnitId!: string;

    @IsUUID()
    @IsNotEmpty()
    budgetPeriodId!: string;

    @IsUUID()
    @IsNotEmpty()
    expenseCategoryId!: string;

    @IsNumberString()
    @IsNotEmpty()
    amount!: string;
}

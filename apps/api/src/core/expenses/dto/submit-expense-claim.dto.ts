import { IsString, IsNotEmpty, IsDateString, IsUUID, IsNumberString, MaxLength } from 'class-validator';

export class SubmitExpenseClaimDto {
    @IsDateString()
    @IsNotEmpty()
    expenseDate!: string;

    @IsUUID()
    @IsNotEmpty()
    expenseCategoryId!: string;

    @IsUUID()
    @IsNotEmpty()
    budgetPeriodId!: string;

    @IsNumberString()
    @IsNotEmpty()
    amount!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    description!: string;

    @IsUUID()
    @IsNotEmpty()
    orgUnitId!: string;
}

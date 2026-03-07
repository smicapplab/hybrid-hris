import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { BudgetLedgerService } from './budget-ledger.service';
import { BudgetsService } from './budgets.service';
import { ExpenseClaimsService } from './expense-claims.service';
import { BudgetsController } from './budgets.controller';
import { ExpenseClaimsController } from './expense-claims.controller';
import { ExpensesMetadataController } from './metadata.controller';

@Module({
    imports: [DatabaseModule],
    providers: [BudgetLedgerService, BudgetsService, ExpenseClaimsService],
    controllers: [BudgetsController, ExpenseClaimsController, ExpensesMetadataController],
    exports: [BudgetsService, ExpenseClaimsService, BudgetLedgerService],
})
export class ExpensesModule { }

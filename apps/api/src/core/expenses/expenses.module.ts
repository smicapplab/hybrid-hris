import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { BudgetLedgerService } from './budget-ledger.service';
import { BudgetsService } from './budgets.service';
import { ExpenseClaimsService } from './expense-claims.service';
import { BudgetsController } from './budgets.controller';
import { ExpenseClaimsController } from './expense-claims.controller';
import { ExpensesMetadataController } from './metadata.controller';
import { UsersModule } from 'src/identity/users/users.module';
import { OrgUnitsModule } from '../org-units/org-units.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [DatabaseModule, UsersModule, OrgUnitsModule, AuditModule],
    providers: [BudgetLedgerService, BudgetsService, ExpenseClaimsService],
    controllers: [BudgetsController, ExpenseClaimsController, ExpensesMetadataController],
    exports: [BudgetsService, ExpenseClaimsService, BudgetLedgerService],
})
export class ExpensesModule { }

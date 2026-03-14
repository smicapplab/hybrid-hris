import { Module } from '@nestjs/common';
import { OvertimeRequestsService } from './overtime-requests.service';
import { OvertimeRequestsController } from './overtime-requests.controller';
import { CoreModule } from 'src/core/core.module';
import { DatabaseModule } from 'src/database/database.module';
import { IdentityModule } from 'src/identity/identity.module';

@Module({
    imports: [
        DatabaseModule,
        CoreModule, // For AuditService and OrgUnitsService
        IdentityModule, // For UsersService
    ],
    controllers: [OvertimeRequestsController],
    providers: [OvertimeRequestsService],
    exports: [OvertimeRequestsService],
})
export class OvertimeRequestsModule { }

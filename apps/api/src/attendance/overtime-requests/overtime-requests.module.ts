import { Module } from '@nestjs/common';
import { OvertimeRequestsService } from './overtime-requests.service';
import { OvertimeRequestsController } from './overtime-requests.controller';
import { CoreModule } from 'src/core/core.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [
        DatabaseModule,
        CoreModule, // For AuditService
    ],
    controllers: [OvertimeRequestsController],
    providers: [OvertimeRequestsService],
    exports: [OvertimeRequestsService],
})
export class OvertimeRequestsModule { }

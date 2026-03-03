import { Module } from '@nestjs/common'
import { LeaveRequestsService } from './leave-requests.service'
import { LeaveRequestsController } from './leave-requests.controller'
import { DatabaseModule } from 'src/database/database.module'

@Module({
    imports: [DatabaseModule],
    providers: [LeaveRequestsService],
    controllers: [LeaveRequestsController],
    exports: [LeaveRequestsService],
})
export class LeaveRequestsModule { }

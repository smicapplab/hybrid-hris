import { Module } from '@nestjs/common'
import { LeaveRequestsService } from './leave-requests.service'
import { LeaveRequestsController } from './leave-requests.controller'
import { DatabaseModule } from 'src/database/database.module'
import { UsersModule } from 'src/identity/users/users.module'
import { OrgUnitsModule } from '../org-units/org-units.module'

@Module({
    imports: [DatabaseModule, UsersModule, OrgUnitsModule],
    providers: [LeaveRequestsService],
    controllers: [LeaveRequestsController],
    exports: [LeaveRequestsService],
})
export class LeaveRequestsModule { }

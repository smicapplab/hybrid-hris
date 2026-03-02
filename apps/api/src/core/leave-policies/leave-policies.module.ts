import { Module } from '@nestjs/common'
import { LeavePoliciesService } from './leave-policies.service'
import { LeavePoliciesController } from './leave-policies.controller'
import { DatabaseModule } from 'src/database/database.module'

@Module({
    imports: [DatabaseModule],
    providers: [LeavePoliciesService],
    controllers: [LeavePoliciesController],
    exports: [LeavePoliciesService],
})
export class LeavePoliciesModule { }

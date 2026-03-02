import { Module } from '@nestjs/common'
import { LeaveTypesService } from './leave-types.service'
import { LeaveTypesController } from './leave-types.controller'
import { DatabaseModule } from 'src/database/database.module'

@Module({
    imports: [DatabaseModule],
    providers: [LeaveTypesService],
    controllers: [LeaveTypesController],
    exports: [LeaveTypesService],
})
export class LeaveTypesModule { }

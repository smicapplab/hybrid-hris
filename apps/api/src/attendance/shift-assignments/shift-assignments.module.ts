import { Module } from '@nestjs/common'
import { ShiftAssignmentsService } from './shift-assignments.service'
import { ShiftAssignmentsController } from './shift-assignments.controller'
import { DatabaseModule } from 'src/database/database.module'

@Module({
  imports: [DatabaseModule],
  providers: [ShiftAssignmentsService],
  controllers: [ShiftAssignmentsController],
  exports: [ShiftAssignmentsService],
})
export class ShiftAssignmentsModule { }
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import {
  CreateTrainingProgramDto,
  UpdateTrainingProgramDto,
  CreateTrainingScheduleDto,
  UpdateTrainingScheduleDto,
  UpdateAttendeeStatusDto,
  SubmitTrainingFeedbackDto,
} from './dto/training.dto';

@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) { }

  @Get('compliance')
  async getTeamCompliance(
    @CurrentUser('employeeId') managerEmployeeId: string,
    @CurrentUser('roles') roles: string[],
    @Query('recursive') recursive?: string,
    @Query('search') search?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('scope') scope?: string,
  ) {
    const isHr = roles.includes(SystemRole.HR_ADMIN) || roles.includes(SystemRole.ADMIN);
    return this.trainingService.getTeamCompliance(managerEmployeeId, {
      recursive: recursive === 'true',
      search,
      offset: offset ? parseInt(offset, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 20,
      scope,
      isHr,
    });
  }

  // --- Programs ---

  @Get('programs')
  async getAllPrograms() {
    return this.trainingService.getAllPrograms();
  }

  @Get('programs/:id')
  async getProgramById(@Param('id') id: string) {
    return this.trainingService.getProgramById(id);
  }

  @Post('programs')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async createProgram(
    @Body() data: CreateTrainingProgramDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.createProgram(data, actorId);
  }

  @Patch('programs/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateProgram(
    @Param('id') id: string,
    @Body() data: UpdateTrainingProgramDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.updateProgram(id, data, actorId);
  }

  // --- Schedules ---

  @Get('programs/:id/schedules')
  async getProgramSchedules(@Param('id') programId: string) {
    return this.trainingService.getSchedulesByProgram(programId);
  }

  @Post('schedules')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async createSchedule(
    @Body() data: CreateTrainingScheduleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.createSchedule(data, actorId);
  }

  @Patch('schedules/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateSchedule(
    @Param('id') id: string,
    @Body() data: UpdateTrainingScheduleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.updateSchedule(id, data, actorId);
  }

  @Get('schedules/upcoming')
  async getUpcomingSchedules() {
    return this.trainingService.getUpcomingSchedules();
  }

  @Get('schedules/:id')
  async getScheduleById(@Param('id') id: string) {
    return this.trainingService.getScheduleWithSessions(id);
  }

  // --- Enrollment (Admin/Manager Flow) ---

  @Post('schedules/:id/enroll')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async enrollEmployees(
    @Param('id') scheduleId: string,
    @Body('employeeIds') employeeIds: string[],
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.enrollEmployees(scheduleId, employeeIds, actorId);
  }

  @Patch('enrollments/:id/status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateAttendeeStatus(
    @Param('id') enrollmentId: string,
    @Body() data: UpdateAttendeeStatusDto,
    @CurrentUser('employeeId') processorId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.updateAttendeeStatus(enrollmentId, data, processorId, actorId);
  }

  // --- Self-Service Flow ---

  @Get('my-training')
  async getMyTraining(@CurrentUser('employeeId') employeeId: string) {
    return this.trainingService.getMyTrainings(employeeId);
  }

  @Post('schedules/:id/self-enroll')
  async selfEnroll(
    @Param('id') scheduleId: string,
    @CurrentUser('employeeId') employeeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.enroll(scheduleId, employeeId, actorId);
  }

  @Post('enrollments/:id/feedback')
  async submitFeedback(
    @Param('id') enrollmentId: string,
    @CurrentUser('employeeId') employeeId: string,
    @Body() data: SubmitTrainingFeedbackDto,
  ) {
    return this.trainingService.submitFeedback(enrollmentId, employeeId, data);
  }

  @Get('programs/:id/feedback')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async getProgramFeedback(
    @Param('id') programId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser('id') actorId?: string,
  ) {
    const pLimit = limit ? parseInt(limit, 10) : 10;
    const pPage = page ? parseInt(page, 10) : 1;
    const offset = (pPage - 1) * pLimit;
    return this.trainingService.getProgramFeedback({
      programId,
      offset,
      limit: pLimit,
    }, actorId);
  }
}

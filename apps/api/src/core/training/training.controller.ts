import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Delete,
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

  @Get('team-compliance')
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

  @Get('programs/:id/schedules')
  async getProgramSchedules(@Param('id') programId: string) {
    return this.trainingService.getSchedulesByProgram(programId);
  }

  // --- Schedules ---

  @Get('schedules/upcoming')
  async getUpcomingSchedules() {
    return this.trainingService.getUpcomingSchedules();
  }

  @Post('schedules')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async createSchedule(
    @Body() data: CreateTrainingScheduleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.createSchedule(data, actorId);
  }

  @Get('schedules/:id')
  async getScheduleById(@Param('id') id: string) {
    return this.trainingService.getScheduleWithSessions(id);
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

  @Get('schedules/:id/public')
  async getPublicScheduleDetails(
    @Param('id') scheduleId: string,
    @CurrentUser('employeeId') currentEmployeeId: string,
  ) {
    return this.trainingService.getPublicScheduleDetails(scheduleId, currentEmployeeId);
  }

  @Get('schedules/:id/attendees')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async getScheduleAttendees(@Param('id') id: string) {
    return this.trainingService.getScheduleAttendees(id);
  }

  @Post('schedules/:id/attendees')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async addAttendee(
    @Param('id') scheduleId: string,
    @Body('employeeId') employeeId: string,
    @CurrentUser('employeeId') processorId: string,
    @CurrentUser('roles') roles: string[],
    @CurrentUser('id') actorId: string,
  ) {
    const isHr = roles.includes(SystemRole.HR_ADMIN) || roles.includes(SystemRole.ADMIN);
    return this.trainingService.addAttendee(scheduleId, employeeId, processorId, isHr, actorId);
  }

  @Post('schedules/:id/enroll')
  async enrollEmployees(
    @Param('id') scheduleId: string,
    @Body('employeeIds') employeeIds: string[],
    @CurrentUser('employeeId') selfEmployeeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    if (employeeIds && employeeIds.length > 0) {
      return this.trainingService.enrollEmployees(scheduleId, employeeIds, actorId);
    }
    // Self-service enrollment
    return this.trainingService.enroll(scheduleId, selfEmployeeId, actorId);
  }

  @Delete('schedules/:id/enroll')
  async selfCancelEnrollment(
    @Param('id') scheduleId: string,
    @CurrentUser('employeeId') employeeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.cancelEnrollment(scheduleId, employeeId, actorId);
  }

  @Post('schedules/:id/enroll-org')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async enrollOrgUnit(
    @Param('id') scheduleId: string,
    @Body('orgUnitId') orgUnitId: string,
    @CurrentUser('employeeId') processorId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.enrollOrgUnit(scheduleId, orgUnitId, processorId, true, actorId);
  }

  @Post('schedules/:id/enroll-eligible')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async enrollAllEligible(
    @Param('id') scheduleId: string,
    @CurrentUser('employeeId') processorId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.enrollAllEligible(scheduleId, processorId, true, actorId);
  }

  @Post('schedules/:id/feedback')
  async submitFeedback(
    @Param('id') scheduleId: string,
    @CurrentUser('employeeId') employeeId: string,
    @Body() data: SubmitTrainingFeedbackDto,
  ) {
    return this.trainingService.submitFeedback(scheduleId, employeeId, data);
  }

  // --- Enrollments / Attendees ---

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

  @Delete('enrollments/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async removeAttendee(@Param('id') enrollmentId: string) {
    return this.trainingService.removeAttendee(enrollmentId);
  }

  @Post('enrollments/bulk-status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async bulkUpdateAttendeeStatus(
    @Body('enrollmentIds') enrollmentIds: string[],
    @Body('data') data: UpdateAttendeeStatusDto,
    @CurrentUser('employeeId') processorId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.trainingService.bulkUpdateAttendeeStatus(enrollmentIds, data, processorId, actorId);
  }

  @Post('enrollments/bulk')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async bulkAddAttendees(
    @Body('scheduleId') scheduleId: string,
    @Body('employeeIds') employeeIds: string[],
    @CurrentUser('employeeId') processorId: string,
    @CurrentUser('id') actorId: string,
  ) {
    const results = [];
    for (const employeeId of employeeIds) {
        results.push(await this.trainingService.addAttendee(scheduleId, employeeId, processorId, true, actorId));
    }
    return { count: results.length };
  }

  // --- Self-Service ---

  @Get('my-trainings')
  async getMyTrainings(@CurrentUser('employeeId') employeeId: string) {
    return this.trainingService.getMyTrainings(employeeId);
  }

  // --- Feedback ---

  @Get('feedback')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async getGlobalFeedback(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('programId') programId?: string,
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

  // --- Mandatory Trainings ---

  @Get('mandatory/positions/:id')
  async getPositionMandatoryTrainings(@Param('id') positionId: string) {
    return this.trainingService.getPositionMandatoryTrainings(positionId);
  }

  @Post('mandatory/positions')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async addMandatoryTrainingToPosition(
    @Body('targetId') positionId: string,
    @Body('programId') programId: string,
  ) {
    return this.trainingService.addMandatoryTrainingToPosition(positionId, programId);
  }

  @Delete('mandatory/positions/:targetId/:programId')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async removeMandatoryTrainingFromPosition(
    @Param('targetId') positionId: string,
    @Param('programId') programId: string,
  ) {
    return this.trainingService.removeMandatoryTrainingFromPosition(positionId, programId);
  }

  @Get('mandatory/org-units/:id')
  async getOrgUnitMandatoryTrainings(@Param('id') orgUnitId: string) {
    return this.trainingService.getOrgUnitMandatoryTrainings(orgUnitId);
  }

  @Post('mandatory/org-units')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async addMandatoryTrainingToOrgUnit(
    @Body('targetId') orgUnitId: string,
    @Body('programId') programId: string,
  ) {
    return this.trainingService.addMandatoryTrainingToOrgUnit(orgUnitId, programId);
  }

  @Delete('mandatory/org-units/:targetId/:programId')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async removeMandatoryTrainingFromOrgUnit(
    @Param('targetId') orgUnitId: string,
    @Param('programId') programId: string,
  ) {
    return this.trainingService.removeMandatoryTrainingFromOrgUnit(orgUnitId, programId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  UnauthorizedException,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { 
  CreateTrainingProgramDto, 
  UpdateTrainingProgramDto, 
  CreateTrainingScheduleDto, 
  UpdateTrainingScheduleDto, 
  UpdateAttendeeStatusDto, 
  BulkUpdateAttendeeStatusDto,
  AddMandatoryTrainingDto
} from './dto/training.dto';

@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

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
  async createProgram(@Body() data: CreateTrainingProgramDto) {
    return this.trainingService.createProgram(data);
  }

  @Patch('programs/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateProgram(
    @Param('id') id: string,
    @Body() data: UpdateTrainingProgramDto,
  ) {
    return this.trainingService.updateProgram(id, data);
  }

  // --- Schedules ---

  @Get('programs/:id/schedules')
  async getSchedulesByProgram(@Param('id') id: string) {
    return this.trainingService.getSchedulesByProgram(id);
  }

  @Get('schedules/upcoming')
  async getUpcomingSchedules() {
    return this.trainingService.getUpcomingSchedules();
  }

  @Get('schedules/:id')
  async getScheduleById(@Param('id') id: string) {
    return this.trainingService.getScheduleWithSessions(id);
  }

  @Post('schedules')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async createSchedule(@Body() data: CreateTrainingScheduleDto) {
    return this.trainingService.createSchedule(data);
  }

  @Patch('schedules/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateSchedule(
    @Param('id') id: string,
    @Body() data: UpdateTrainingScheduleDto,
  ) {
    return this.trainingService.updateSchedule(id, data);
  }

  @Get('schedules/:id/attendees')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async getScheduleAttendees(@Param('id') id: string) {
    return this.trainingService.getScheduleAttendees(id);
  }

  @Post('schedules/:id/attendees')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async addAttendee(
    @Param('id') id: string,
    @Body('employeeId') employeeId: string,
    @CurrentUser('employeeId') processorId: string,
  ) {
    return this.trainingService.addAttendee(id, employeeId, processorId);
  }

  @Post('schedules/:id/enroll-org')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async enrollOrgUnit(
    @Param('id') id: string,
    @Body('orgUnitId') orgUnitId: string,
    @CurrentUser('employeeId') processorId: string,
  ) {
    return this.trainingService.enrollOrgUnit(id, orgUnitId, processorId);
  }

  @Post('schedules/:id/enroll-eligible')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async enrollAllEligible(
    @Param('id') id: string,
    @CurrentUser('employeeId') processorId: string,
  ) {
    return this.trainingService.enrollAllEligible(id, processorId);
  }

  @Patch('enrollments/bulk-status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async bulkUpdateStatus(
    @Body() data: BulkUpdateAttendeeStatusDto,
    @CurrentUser('employeeId') processorId: string,
  ) {
    return this.trainingService.bulkUpdateAttendeeStatus(data.enrollmentIds, data, processorId);
  }

  @Delete('enrollments/bulk')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async bulkRemove(@Body('enrollmentIds') enrollmentIds: string[]) {
    return this.trainingService.bulkRemoveAttendees(enrollmentIds);
  }

  @Patch('enrollments/:id/status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateAttendeeStatus(
    @Param('id') id: string,
    @Body() data: UpdateAttendeeStatusDto,
    @CurrentUser('employeeId') processorId: string,
  ) {
    return this.trainingService.updateAttendeeStatus(id, data, processorId);
  }

  @Delete('enrollments/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async removeAttendee(@Param('id') id: string) {
    return this.trainingService.removeAttendee(id);
  }

  // --- Public / Enrollment Endpoints ---

  @Get('schedules/:id/public')
  async getPublicScheduleDetails(
    @Param('id') id: string,
    @CurrentUser('employeeId') employeeId: string,
  ) {
    return this.trainingService.getPublicScheduleDetails(id, employeeId);
  }

  @Post('schedules/:id/enroll')
  async enroll(
    @Param('id') id: string,
    @CurrentUser('employeeId') employeeId: string,
  ) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.trainingService.enroll(id, employeeId);
  }

  @Delete('schedules/:id/enroll')
  async cancelEnrollment(
    @Param('id') id: string,
    @CurrentUser('employeeId') employeeId: string,
  ) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.trainingService.cancelEnrollment(id, employeeId);
  }

  @Get('my-trainings')
  async getMyTrainings(@CurrentUser('employeeId') employeeId: string) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.trainingService.getMyTrainings(employeeId);
  }

  @Get('team-compliance')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async getTeamCompliance(
    @CurrentUser('employeeId') managerEmployeeId: string,
    @CurrentUser('roles') roles: string[],
    @Query('recursive') recursive?: string,
    @Query('search') search?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('scope') scope?: string,
  ) {
    if (!managerEmployeeId) throw new UnauthorizedException('Not linked to an employee profile');
    const isHr = roles.includes(SystemRole.HR_ADMIN) || roles.includes(SystemRole.ADMIN);
    return this.trainingService.getTeamCompliance(managerEmployeeId, {
      recursive: recursive === 'true',
      search,
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      scope,
      isHr,
    });
  }

  // --- Mandatory Training Requirements ---

  @Get('mandatory/positions/:positionId')
  async getPositionMandatoryTrainings(@Param('positionId') positionId: string) {
    return this.trainingService.getPositionMandatoryTrainings(positionId);
  }

  @Post('mandatory/positions')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async addMandatoryTrainingToPosition(@Body() data: AddMandatoryTrainingDto) {
    if (!data.positionId) throw new UnprocessableEntityException('positionId is required');
    return this.trainingService.addMandatoryTrainingToPosition(data.positionId, data.programId);
  }

  @Delete('mandatory/positions/:positionId/:programId')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async removeMandatoryTrainingFromPosition(
    @Param('positionId') positionId: string,
    @Param('programId') programId: string
  ) {
    return this.trainingService.removeMandatoryTrainingFromPosition(positionId, programId);
  }

  @Get('mandatory/org-units/:orgUnitId')
  async getOrgUnitMandatoryTrainings(@Param('orgUnitId') orgUnitId: string) {
    return this.trainingService.getOrgUnitMandatoryTrainings(orgUnitId);
  }

  @Post('mandatory/org-units')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async addMandatoryTrainingToOrgUnit(@Body() data: AddMandatoryTrainingDto) {
    if (!data.orgUnitId) throw new UnprocessableEntityException('orgUnitId is required');
    return this.trainingService.addMandatoryTrainingToOrgUnit(data.orgUnitId, data.programId);
  }

  @Delete('mandatory/org-units/:orgUnitId/:programId')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async removeMandatoryTrainingFromOrgUnit(
    @Param('orgUnitId') orgUnitId: string,
    @Param('programId') programId: string
  ) {
    return this.trainingService.removeMandatoryTrainingFromOrgUnit(orgUnitId, programId);
  }
}

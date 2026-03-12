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
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SystemRole, ProficiencyLevel, TrainingScheduleStatus, TrainingEnrollmentStatus } from '@hybrid-hris/domain';

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
  async createProgram(
    @Body()
    data: {
      title: string;
      description?: string;
      objectives?: string;
      type: 'INTERNAL' | 'EXTERNAL';
      isMandatory?: boolean;
      skillIds?: { id: string; level: ProficiencyLevel }[];
      prerequisiteIds?: string[];
    },
  ) {
    return this.trainingService.createProgram(data);
  }

  @Patch('programs/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateProgram(
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      description?: string;
      objectives?: string;
      type?: 'INTERNAL' | 'EXTERNAL';
      isMandatory?: boolean;
      skillIds?: { id: string; level: ProficiencyLevel }[];
      prerequisiteIds?: string[];
    },
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
  async createSchedule(
    @Body()
    data: {
      programId: string;
      location?: string;
      capacity?: number;
      startAt: string;
      endAt: string;
      trainerId?: string;
      externalTrainer?: string;
      sessions?: { title?: string; location?: string; startAt: string; endAt: string }[];
    },
  ) {
    return this.trainingService.createSchedule({
      ...data,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      sessions: data.sessions?.map(s => ({
        ...s,
        startAt: new Date(s.startAt),
        endAt: new Date(s.endAt),
      })),
    });
  }

  @Patch('schedules/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateSchedule(
    @Param('id') id: string,
    @Body()
    data: {
      location?: string;
      capacity?: number;
      startAt?: string;
      endAt?: string;
      trainerId?: string;
      externalTrainer?: string;
      status?: TrainingScheduleStatus;
      sessions?: { title?: string; location?: string; startAt: string; endAt: string }[];
    },
  ) {
    return this.trainingService.updateSchedule(id, {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
      status: data.status,
      sessions: data.sessions?.map(s => ({
        ...s,
        startAt: new Date(s.startAt),
        endAt: new Date(s.endAt),
      })),
    });
  }

  @Get('schedules/:id/attendees')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async getScheduleAttendees(@Param('id') id: string) {
    return this.trainingService.getScheduleAttendees(id);
  }

  @Post('schedules/:id/attendees')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async addAttendee(
    @Param('id') id: string,
    @Body('employeeId') employeeId: string,
    @CurrentUser('employeeId') processorId: string,
  ) {
    return this.trainingService.addAttendee(id, employeeId, processorId);
  }

  @Post('schedules/:id/enroll-org')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async enrollOrgUnit(
    @Param('id') id: string,
    @Body('orgUnitId') orgUnitId: string,
    @CurrentUser('employeeId') processorId: string,
  ) {
    return this.trainingService.enrollOrgUnit(id, orgUnitId, processorId);
  }

  @Patch('enrollments/bulk-status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async bulkUpdateStatus(
    @Body() data: { enrollmentIds: string[]; status: TrainingEnrollmentStatus; notes?: string },
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
    @Body() data: { status: TrainingEnrollmentStatus; notes?: string },
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
}

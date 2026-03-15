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
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { 
  AssignSkillDto, 
  DeclareSkillDto, 
  ProcessSkillApprovalDto,
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
  CreateSkillDto,
  UpdateSkillDto,
  AddSkillToPositionDto
} from './dto/skills.dto';

@Controller('skills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) { }

  // --- Employee Profile Skills ---

  @Get('my-skills')
  async getMySkills(@CurrentUser('employeeId') employeeId: string) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.skillsService.getEmployeeSkills(employeeId);
  }

  @Get('team-gap')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async getTeamSkillGap(
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
    return this.skillsService.getTeamSkillGap(managerEmployeeId, {
      recursive: recursive === 'true',
      search,
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      scope,
      isHr,
    });
  }

  @Post('assign')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async assignSkill(
    @CurrentUser('employeeId') managerEmployeeId: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('roles') roles: string[],
    @Body() data: AssignSkillDto
  ) {
    if (!managerEmployeeId) throw new UnauthorizedException('Not linked to an employee profile');
    const isHr = roles.includes(SystemRole.HR_ADMIN) || roles.includes(SystemRole.ADMIN);
    return this.skillsService.assignSkillToReport(managerEmployeeId, data, actorId, isHr);
  }

  @Post('my-skills')
  async declareSkill(
    @CurrentUser('employeeId') employeeId: string,
    @CurrentUser('id') actorId: string,
    @Body() data: DeclareSkillDto
  ) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.skillsService.declareSkill(employeeId, data, actorId);
  }

  @Delete('my-skills/:id')
  async removeSkill(
    @CurrentUser('employeeId') employeeId: string,
    @CurrentUser('id') actorId: string,
    @Param('id') id: string
  ) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.skillsService.removeSkill(employeeId, id, actorId);
  }

  // --- Manager Skill Approvals ---

  @Get('approvals/pending')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async getPendingSkills(
    @CurrentUser('employeeId') managerEmployeeId: string,
    @CurrentUser('roles') roles: string[]
  ) {
    if (!managerEmployeeId) throw new UnauthorizedException('Not linked to an employee profile');
    const isHr = roles.includes(SystemRole.HR_ADMIN) || roles.includes(SystemRole.ADMIN);
    return this.skillsService.getPendingSkillsForManager(managerEmployeeId, isHr);
  }

  @Patch('approvals/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async approveSkill(
    @Param('id') id: string,
    @CurrentUser('employeeId') managerEmployeeId: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('roles') roles: string[],
    @Body() data: ProcessSkillApprovalDto
  ) {
    if (!managerEmployeeId) throw new UnauthorizedException('Not linked to an employee profile');
    const isHr = roles.includes(SystemRole.HR_ADMIN) || roles.includes(SystemRole.ADMIN);
    return this.skillsService.processSkillApproval(id, managerEmployeeId, data, actorId, isHr);
  }

  @Get('talent-card/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async getEmployeeTalentCard(
    @Param('id') id: string,
    @CurrentUser('employeeId') managerEmployeeId: string,
    @CurrentUser('roles') roles: string[]
  ) {
    if (!managerEmployeeId) throw new UnauthorizedException('Not linked to an employee profile');
    const isHr = roles.includes(SystemRole.HR_ADMIN) || roles.includes(SystemRole.ADMIN);
    return this.skillsService.getEmployeeTalentCard(id, managerEmployeeId, isHr);
  }

  // --- Taxonomy (Admin) ---

  @Get('taxonomy')
  async getTaxonomy() {
    return this.skillsService.getTaxonomy();
  }

  @Get('categories')
  async getAllCategories() {
    return this.skillsService.getAllCategories();
  }

  @Post('categories')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async createCategory(
      @Body() data: CreateSkillCategoryDto,
      @CurrentUser('id') actorId: string,
    ) {
    return this.skillsService.createCategory(data, actorId);
  }

  @Patch('categories/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body() data: UpdateSkillCategoryDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.skillsService.updateCategory(id, data, actorId);
  }

  @Get('categories/:categoryId/skills')
  async getSkillsByCategory(@Param('categoryId') categoryId: string) {
    return this.skillsService.getSkillsByCategory(categoryId);
  }

  @Post('skills')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async createSkill(
    @Body() data: CreateSkillDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.skillsService.createSkill(data, actorId);
  }

  @Patch('skills/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateSkill(
    @Param('id') id: string,
    @Body() data: UpdateSkillDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.skillsService.updateSkill(id, data, actorId);
  }

  // --- Position Skills (Role Competencies) ---

  @Get('positions/:positionId')
  async getPositionSkills(@Param('positionId') positionId: string) {
    return this.skillsService.getPositionSkills(positionId);
  }

  @Post('positions')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async addSkillToPosition(
      @Body() data: AddSkillToPositionDto,
      @CurrentUser('id') actorId: string,
    ) {
    return this.skillsService.addSkillToPosition(data, actorId);
  }

  @Delete('positions/:positionId/:skillId')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async removeSkillFromPosition(
    @Param('positionId') positionId: string,
    @Param('skillId') skillId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.skillsService.removeSkillFromPosition(positionId, skillId, actorId);
  }
}

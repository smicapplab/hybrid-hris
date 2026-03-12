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
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SystemRole, ProficiencyLevel } from '@hybrid-hris/domain';

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

  @Post('my-skills')
  async declareSkill(
    @CurrentUser('employeeId') employeeId: string,
    @Body() data: {
      skillId: string;
      proficiencyLevel: ProficiencyLevel;
      acquiredDate: string;
      evidenceUrl?: string;
      notes?: string;
    }
  ) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.skillsService.declareSkill(employeeId, data);
  }

  @Delete('my-skills/:id')
  async removeSkill(
    @CurrentUser('employeeId') employeeId: string,
    @Param('id') id: string
  ) {
    if (!employeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.skillsService.removeSkill(employeeId, id);
  }

  // --- Manager Skill Approvals ---

  @Get('approvals/pending')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async getPendingSkills(@CurrentUser('employeeId') managerEmployeeId: string) {
    if (!managerEmployeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.skillsService.getPendingSkillsForManager(managerEmployeeId);
  }

  @Patch('approvals/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.SUPERVISOR, SystemRole.MANAGER)
  async approveSkill(
    @Param('id') id: string,
    @CurrentUser('employeeId') managerEmployeeId: string,
    @Body() data: { status: 'VERIFIED' | 'REJECTED'; notes?: string }
  ) {
    if (!managerEmployeeId) throw new UnauthorizedException('Not linked to an employee profile');
    return this.skillsService.processSkillApproval(id, managerEmployeeId, data);
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
  async createCategory(@Body() data: { name: string; description?: string }) {
    return this.skillsService.createCategory(data);
  }

  @Patch('categories/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body() data: { name?: string; description?: string },
  ) {
    return this.skillsService.updateCategory(id, data);
  }

  @Get('categories/:categoryId/skills')
  async getSkillsByCategory(@Param('categoryId') categoryId: string) {
    return this.skillsService.getSkillsByCategory(categoryId);
  }

  @Post('skills')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async createSkill(
    @Body()
    data: {
      categoryId: string;
      name: string;
      type?: string;
      description?: string;
      expiryMonths?: number;
    },
  ) {
    return this.skillsService.createSkill(data);
  }

  @Patch('skills/:id')
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  async updateSkill(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      type?: string;
      description?: string;
      expiryMonths?: number | null;
      isActive?: boolean;
    },
  ) {
    return this.skillsService.updateSkill(id, data);
  }
}

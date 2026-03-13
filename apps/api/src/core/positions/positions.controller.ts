import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'

import { PositionsService } from './positions.service'
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly service: PositionsService) { }

  @Get()
  async getAll(
    @Query('active') active?: string,
    @Query('code') code?: string,
    @Query('title') title?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getAll({
      active: active === 'true',
      code,
      title,
      search,
    })
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getById(id)
  }

  @UseGuards(RolesGuard)
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  @Post()
  async create(
    @Body()
    body: {
      code: string
      title: string
      description?: string
    },
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.create(body, actorId)
  }

  @UseGuards(RolesGuard)
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      code?: string
      title?: string
      description?: string
      isActive?: boolean
    },
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.update(id, body, actorId)
  }

  @UseGuards(RolesGuard)
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  @Delete(':id')
  async softDelete(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.softDelete(id, actorId)
  }

  @UseGuards(RolesGuard)
  @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
  @Patch(':id/restore')
  async restore(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.restore(id, actorId)
  }
}
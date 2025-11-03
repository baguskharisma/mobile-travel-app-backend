import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, QueryTicketsDto } from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import type { CurrentUserType } from '../../auth/decorators';
import { UserRole } from '@prisma/client';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    return this.ticketsService.create(createTicketDto, user.id, user.role);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() query: QueryTicketsDto,
  ) {
    return this.ticketsService.findAll(query, user.id, user.role);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.ticketsService.findOne(id, user.id, user.role);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  confirm(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.ticketsService.confirm(id, user.id, user.role);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  cancel(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.ticketsService.cancel(id, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}

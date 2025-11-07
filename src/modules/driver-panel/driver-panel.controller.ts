import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DriverPanelService } from './driver-panel.service';
import { UpdateTripStatusDto } from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import type { CurrentUserType } from '../../auth/decorators';
import { UserRole, ScheduleStatus } from '@prisma/client';

@Controller('driver')
@Roles(UserRole.DRIVER)
export class DriverPanelController {
  constructor(private readonly driverPanelService: DriverPanelService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserType) {
    return this.driverPanelService.getProfile(user.id);
  }

  @Get('trips')
  getAssignedTrips(
    @CurrentUser() user: CurrentUserType,
    @Query('status') status?: ScheduleStatus,
  ) {
    return this.driverPanelService.getAssignedTrips(user.id, status);
  }

  @Get('trips/:scheduleId')
  getTripDetail(
    @CurrentUser() user: CurrentUserType,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.driverPanelService.getTripDetail(user.id, scheduleId);
  }

  @Get('trips/:scheduleId/passengers')
  getPassengerList(
    @CurrentUser() user: CurrentUserType,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.driverPanelService.getPassengerList(user.id, scheduleId);
  }

  @Post('trips/:scheduleId/status')
  @HttpCode(HttpStatus.OK)
  updateTripStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('scheduleId') scheduleId: string,
    @Body() updateDto: UpdateTripStatusDto,
  ) {
    return this.driverPanelService.updateTripStatus(user.id, scheduleId, updateDto);
  }
}

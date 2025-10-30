import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoinRequestService } from './services/coin-request.service';
import {
  CreateCoinRequestDto,
  QueryCoinRequestsDto,
  ApproveCoinRequestDto,
  RejectCoinRequestDto,
} from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import type { CurrentUserType } from '../../auth/decorators';
import { UserRole } from '../../../generated/prisma';

@Controller('coin-requests')
export class CoinRequestController {
  constructor(private readonly coinRequestService: CoinRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN) // Only regular admins can request coins
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createDto: CreateCoinRequestDto,
  ) {
    // user.profile.id is the admin ID
    return this.coinRequestService.create(user.profile!.id, createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() query: QueryCoinRequestsDto,
  ) {
    // Pass user ID to filter requests based on role
    return this.coinRequestService.findAll(query, user.id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.coinRequestService.findOne(id, user.id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN) // Only super admin can approve
  approve(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() approveDto: ApproveCoinRequestDto,
  ) {
    return this.coinRequestService.approve(id, user.id, approveDto);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN) // Only super admin can reject
  reject(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() rejectDto: RejectCoinRequestDto,
  ) {
    return this.coinRequestService.reject(id, user.id, rejectDto);
  }
}

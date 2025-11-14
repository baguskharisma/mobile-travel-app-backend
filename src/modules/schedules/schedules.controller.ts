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
import { SchedulesService } from './schedules.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  AssignDriverDto,
  QuerySchedulesDto,
  BookedSeatsResponseDto,
} from './dto';
import { Roles } from '../../auth/decorators';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  findAll(@Query() query: QuerySchedulesDto) {
    return this.schedulesService.findAll(query);
  }

  @Get('upcoming')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  findUpcoming(@Query('limit') limit?: number) {
    return this.schedulesService.findUpcoming(limit);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Get(':id/booked-seats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get booked seats for a schedule',
    description: 'Returns list of seat numbers that are already booked (PENDING or APPROVED payment proofs only)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of booked seat numbers',
    type: BookedSeatsResponseDto
  })
  getBookedSeats(@Param('id') id: string): Promise<BookedSeatsResponseDto> {
    return this.schedulesService.getBookedSeats(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Patch(':id/assign-driver')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  assignDriver(@Param('id') id: string, @Body() assignDriverDto: AssignDriverDto) {
    return this.schedulesService.assignDriver(id, assignDriverDto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  cancel(@Param('id') id: string) {
    return this.schedulesService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}

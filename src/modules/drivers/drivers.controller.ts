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
import { DriversService } from './drivers.service';
import { CreateDriverDto, QueryDriversDto, UpdateDriverDto, UpdateDriverStatusDto } from './dto';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../../generated/prisma';

@Controller('drivers')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  findAll(@Query() query: QueryDriversDto) {
    return this.driversService.findAll(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driversService.update(id, updateDriverDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateDriverStatusDto,
  ) {
    return this.driversService.updateStatus(id, updateStatusDto);
  }
}

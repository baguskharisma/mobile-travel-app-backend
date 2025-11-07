import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto, QueryDriversDto, UpdateDriverDto, UpdateDriverStatusDto } from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '@prisma/client';
import { createFileUploadInterceptor } from '../../common/upload/interceptors/file-upload.interceptor';
import { UploadType } from '../../common/upload/upload.config';

@Controller('drivers')
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

  @Get('profile/me')
  @Roles(UserRole.DRIVER)
  getMyProfile(@CurrentUser('userId') userId: string) {
    return this.driversService.findByUserId(userId);
  }

  @Patch('profile/me')
  @Roles(UserRole.DRIVER)
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    return this.driversService.updateByUserId(userId, updateDriverDto);
  }

  @Post('profile/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DRIVER)
  @UseInterceptors(createFileUploadInterceptor(UploadType.PROFILE, 'image'))
  async uploadProfileImage(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.driversService.uploadProfileImage(userId, file);
  }

  @Delete('profile/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DRIVER)
  deleteProfileImage(@CurrentUser('userId') userId: string) {
    return this.driversService.deleteProfileImage(userId);
  }

  @Post(':id/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(createFileUploadInterceptor(UploadType.PROFILE, 'image'))
  async uploadDriverImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.driversService.uploadImage(id, file);
  }

  @Delete(':id/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  deleteDriverImage(@Param('id') id: string) {
    return this.driversService.deleteImage(id);
  }
}

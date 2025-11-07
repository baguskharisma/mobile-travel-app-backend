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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto, QueryAdminsDto, UpdateAdminDto, UpdateAdminStatusDto } from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '@prisma/client';
import { createFileUploadInterceptor } from '../../common/upload/interceptors/file-upload.interceptor';
import { UploadType } from '../../common/upload/upload.config';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryAdminsDto) {
    return this.adminsService.findAll(query);
  }

  @Get('profile/me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getMyProfile(@CurrentUser('userId') userId: string) {
    return this.adminsService.findByUserId(userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(id);
  }

  @Patch('profile/me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminsService.updateByUserId(userId, updateAdminDto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminsService.update(id, updateAdminDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAdminStatusDto,
  ) {
    return this.adminsService.updateStatus(id, updateStatusDto);
  }

  @Post('profile/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(createFileUploadInterceptor(UploadType.PROFILE, 'image'))
  async uploadProfileImage(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminsService.uploadProfileImage(userId, file);
  }

  @Delete('profile/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  deleteProfileImage(@CurrentUser('userId') userId: string) {
    return this.adminsService.deleteProfileImage(userId);
  }

  @Post(':id/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(createFileUploadInterceptor(UploadType.PROFILE, 'image'))
  async uploadAdminImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminsService.uploadImage(id, file);
  }

  @Delete(':id/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  deleteAdminImage(@Param('id') id: string) {
    return this.adminsService.deleteImage(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.adminsService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  restore(@Param('id') id: string) {
    return this.adminsService.restore(id);
  }
}

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
import { CustomersService } from './customers.service';
import { QueryCustomersDto, UpdateCustomerDto } from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '@prisma/client';
import { createFileUploadInterceptor } from '../../common/upload/interceptors/file-upload.interceptor';
import { UploadType } from '../../common/upload/upload.config';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(@Query() query: QueryCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get('profile/me')
  @Roles(UserRole.CUSTOMER)
  getMyProfile(@CurrentUser('userId') userId: string) {
    return this.customersService.findByUserId(userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch('profile/me')
  @Roles(UserRole.CUSTOMER)
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.updateByUserId(userId, updateCustomerDto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Post('profile/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CUSTOMER)
  @UseInterceptors(createFileUploadInterceptor(UploadType.PROFILE, 'image'))
  async uploadProfileImage(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.customersService.uploadProfileImage(userId, file);
  }

  @Delete('profile/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CUSTOMER)
  deleteProfileImage(@CurrentUser('userId') userId: string) {
    return this.customersService.deleteProfileImage(userId);
  }

  @Post(':id/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(createFileUploadInterceptor(UploadType.PROFILE, 'image'))
  async uploadCustomerImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.customersService.uploadImage(id, file);
  }

  @Delete(':id/image')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  deleteCustomerImage(@Param('id') id: string) {
    return this.customersService.deleteImage(id);
  }
}

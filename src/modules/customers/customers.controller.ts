import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { QueryCustomersDto, UpdateCustomerDto } from './dto';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../../generated/prisma';

@Controller('customers')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query() query: QueryCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }
}

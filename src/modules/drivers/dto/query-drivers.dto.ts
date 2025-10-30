import { IsOptional, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { DriverStatus, UserStatus } from '../../../../generated/prisma';

export class QueryDriversDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(DriverStatus)
  driverStatus?: DriverStatus;

  @IsOptional()
  @IsEnum(UserStatus)
  userStatus?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateAdminStatusDto {
  @IsEnum(UserStatus, { message: 'Status must be one of: ACTIVE, INACTIVE, SUSPENDED' })
  @IsNotEmpty()
  status: UserStatus;
}

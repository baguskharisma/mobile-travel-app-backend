import { IsEnum, IsNotEmpty } from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class UpdateDriverStatusDto {
  @IsEnum(DriverStatus, { message: 'Status must be one of: AVAILABLE, ON_TRIP, OFF_DUTY' })
  @IsNotEmpty()
  status: DriverStatus;
}

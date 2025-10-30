import { IsEnum, IsNotEmpty } from 'class-validator';
import { DriverStatus } from '../../../../generated/prisma';

export class UpdateDriverStatusDto {
  @IsEnum(DriverStatus, { message: 'Status must be one of: AVAILABLE, ON_TRIP, OFF_DUTY' })
  @IsNotEmpty()
  status: DriverStatus;
}

import { IsEnum, IsNotEmpty } from 'class-validator';
import { VehicleStatus } from '@prisma/client';

export class UpdateVehicleStatusDto {
  @IsEnum(VehicleStatus)
  @IsNotEmpty()
  status: VehicleStatus;
}

import { IsEnum, IsNotEmpty } from 'class-validator';
import { VehicleStatus } from '../../../../generated/prisma';

export class UpdateVehicleStatusDto {
  @IsEnum(VehicleStatus)
  @IsNotEmpty()
  status: VehicleStatus;
}

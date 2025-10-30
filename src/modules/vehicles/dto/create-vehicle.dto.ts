import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';
import { VehicleType } from '../../../../generated/prisma';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/, {
    message:
      'Vehicle number must be a valid Indonesian license plate format (e.g., B 1234 ABC)',
  })
  vehicleNumber: string;

  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number;
}

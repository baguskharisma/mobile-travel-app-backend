import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';
import { VehicleType } from '@prisma/client';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/, {
    message:
      'Vehicle number must be a valid Indonesian license plate format (e.g., B 1234 ABC)',
  })
  vehicleNumber?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;
}

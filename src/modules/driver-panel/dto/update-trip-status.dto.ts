import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { TripStatus } from '../../../../generated/prisma';

export class UpdateTripStatusDto {
  @IsEnum(TripStatus)
  @IsNotEmpty()
  status: TripStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

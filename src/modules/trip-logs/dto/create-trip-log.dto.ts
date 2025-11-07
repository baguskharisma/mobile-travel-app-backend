import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { TripStatus } from '@prisma/client';

export class CreateTripLogDto {
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

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

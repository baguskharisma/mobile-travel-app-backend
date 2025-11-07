import { IsOptional, IsInt, Min, IsEnum, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleStatus } from '@prisma/client';

export enum ScheduleSortBy {
  NEAREST = 'nearest',        // Terdekat - berdasarkan waktu keberangkatan terdekat
  FARTHEST = 'farthest',      // Terjauh - berdasarkan waktu keberangkatan terjauh
  CHEAPEST = 'cheapest',      // Termurah - berdasarkan harga terendah
  MOST_EXPENSIVE = 'expensive', // Termahal - berdasarkan harga tertinggi
}

export class QuerySchedulesDto {
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
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(ScheduleSortBy)
  sortBy?: ScheduleSortBy;
}

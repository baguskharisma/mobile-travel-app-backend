import { IsOptional, IsInt, Min, IsEnum, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TravelDocumentStatus } from '../../../../generated/prisma';

export class QueryTravelDocumentsDto {
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
  scheduleId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  adminId?: string;

  @IsOptional()
  @IsEnum(TravelDocumentStatus)
  status?: TravelDocumentStatus;

  @IsOptional()
  @IsString()
  search?: string; // Search by document number

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

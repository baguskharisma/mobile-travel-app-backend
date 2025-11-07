import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';

export class UpdateScheduleDto {
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
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableSeats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  driverWage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  snackCost?: number;
}

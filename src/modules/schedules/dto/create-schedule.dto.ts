import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  routeId: string;

  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsDateString()
  @IsNotEmpty()
  departureTime: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'Price must be at least 0' })
  price: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: 'Available seats must be at least 1' })
  availableSeats: number;
}

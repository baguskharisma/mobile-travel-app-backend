import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateTravelDocumentDto {
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  driverName: string;

  @IsString()
  @IsNotEmpty()
  driverPhone: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: 'Total passengers must be at least 1' })
  totalPassengers: number;

  @IsDateString()
  @IsNotEmpty()
  departureDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

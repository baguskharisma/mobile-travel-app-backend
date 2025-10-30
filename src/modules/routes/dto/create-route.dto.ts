import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]+-[A-Z0-9]+-\d+$/, {
    message:
      'Route code must follow format: ORIGIN-DESTINATION-NUMBER (e.g., JKT-BDG-001)',
  })
  routeCode: string;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDuration?: number; // in minutes

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  basePrice: number;
}

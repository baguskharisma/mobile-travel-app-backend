import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Matches,
} from 'class-validator';

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]+-[A-Z0-9]+-\d+$/, {
    message:
      'Route code must follow format: ORIGIN-DESTINATION-NUMBER (e.g., JKT-BDG-001)',
  })
  routeCode?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

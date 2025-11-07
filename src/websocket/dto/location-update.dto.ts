import { IsNumber, IsString, IsOptional } from 'class-validator';

export class LocationUpdateDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class SubscribeToScheduleDto {
  @IsString()
  scheduleId: string;
}

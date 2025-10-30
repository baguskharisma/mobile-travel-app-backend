import { IsOptional, IsString } from 'class-validator';

export class ApproveCoinRequestDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

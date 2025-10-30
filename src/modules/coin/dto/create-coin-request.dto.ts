import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCoinRequestDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

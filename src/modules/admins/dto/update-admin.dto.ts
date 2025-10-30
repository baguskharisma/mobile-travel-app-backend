import { IsString, IsOptional, MinLength, Matches, IsInt, Min } from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Phone number must be a valid Indonesian phone number',
  })
  phone?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Coin balance cannot be negative' })
  coinBalance?: number;
}

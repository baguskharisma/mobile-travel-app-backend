import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateDriverDto {
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
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

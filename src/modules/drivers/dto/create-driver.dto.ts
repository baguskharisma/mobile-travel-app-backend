import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, IsOptional } from 'class-validator';

export class CreateDriverDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Phone number must be a valid Indonesian phone number',
  })
  phone: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

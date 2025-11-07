import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^(\+62|62|0)?8[0-9]{8,11}$/, {
    message: 'Phone must be a valid Indonesian phone number',
  })
  phone: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

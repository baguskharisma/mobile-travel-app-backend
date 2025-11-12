import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Phone number (format Indonesia: 08xxx atau +628xxx)',
    example: '081234567890',
    pattern: '^(\\+62|62|0)[0-9]{9,12}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Phone number must be in valid Indonesian format (08xxx or +628xxx)',
  })
  phone: string;

  @ApiProperty({
    description: 'OTP code (6 digit)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP code must be exactly 6 digits',
  })
  code: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    example: 'NewPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

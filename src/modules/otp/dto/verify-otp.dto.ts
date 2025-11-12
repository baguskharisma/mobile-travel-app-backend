import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Nomor HP yang menerima OTP',
    example: '081234567890',
    pattern: '^(\\+62|62|0)[0-9]{9,12}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Phone number must be a valid Indonesian phone number',
  })
  phone: string;

  @ApiProperty({
    description: 'Kode OTP 6 digit',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP code must contain only numbers' })
  code: string;
}

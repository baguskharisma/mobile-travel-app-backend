import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Nomor HP tujuan (format Indonesia)',
    example: '081234567890',
    pattern: '^(\\+62|62|0)[0-9]{9,12}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Phone number must be a valid Indonesian phone number',
  })
  phone: string;
}

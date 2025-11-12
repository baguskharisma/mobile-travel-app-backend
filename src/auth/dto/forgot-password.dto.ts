import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ForgotPasswordDto {
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
}

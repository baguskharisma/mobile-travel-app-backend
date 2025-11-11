import { IsString, IsOptional, MinLength, Matches, IsInt, Min, IsDateString, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';

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

  @IsOptional()
  @IsDateString({}, { message: 'Birth date must be a valid date (ISO 8601 format)' })
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
  gender?: Gender;
}

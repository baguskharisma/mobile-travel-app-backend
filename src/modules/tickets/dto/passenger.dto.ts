import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class PassengerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{16}$/, {
    message: 'Identity number must be a valid 16-digit NIK',
  })
  identityNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Phone number must be a valid Indonesian phone number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  seatNumber?: string;
}

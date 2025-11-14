import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';

export class PaymentProofPassengerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @Length(16, 16, { message: 'Identity number must be exactly 16 digits' })
  @Matches(/^[0-9]{16}$/, {
    message: 'Identity number must be 16 digits',
  })
  identityNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+62|62|0)8[0-9]{8,12}$/, {
    message: 'Phone must be a valid Indonesian phone number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  seatNumber?: string;
}

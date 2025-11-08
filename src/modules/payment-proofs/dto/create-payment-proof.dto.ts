import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaymentProofPassengerDto } from './passenger.dto';

export class CreatePaymentProofDto {
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @IsString()
  @IsNotEmpty({ message: 'Booker phone number is required' })
  @Matches(/^(\+62|62|0)?8[0-9]{8,11}$/, {
    message: 'Booker phone must be a valid Indonesian phone number',
  })
  bookerPhone: string;

  @IsString()
  @IsNotEmpty({ message: 'Pickup address is required' })
  pickupAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Dropoff address is required' })
  dropoffAddress: string;

  @Transform(({ value }) => {
    // If passengers comes as JSON string from multipart form-data, parse it
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value; // Let validator handle the error
      }
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one passenger is required' })
  @ValidateNested({ each: true })
  @Type(() => PaymentProofPassengerDto)
  passengers: PaymentProofPassengerDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

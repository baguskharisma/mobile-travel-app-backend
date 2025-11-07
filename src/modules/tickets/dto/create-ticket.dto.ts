import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PassengerDto } from './passenger.dto';
import { BookingSource } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @IsOptional()
  @IsString()
  customerId?: string; // For admin bookings on behalf of customers

  @IsEnum(BookingSource)
  @IsNotEmpty()
  bookingSource: BookingSource;

  @IsString()
  @IsNotEmpty({ message: 'Booker phone number is required' })
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Booker phone must be a valid Indonesian phone number',
  })
  bookerPhone: string;

  @IsString()
  @IsNotEmpty({ message: 'Pickup address is required' })
  pickupAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Dropoff address is required' })
  dropoffAddress: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one passenger is required' })
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

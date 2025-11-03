import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
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

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one passenger is required' })
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

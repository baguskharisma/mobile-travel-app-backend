import { ApiProperty } from '@nestjs/swagger';

export class BookedSeatsResponseDto {
  @ApiProperty({
    description: 'List of booked seat numbers for the schedule',
    example: [1, 2, 3, 5, 7],
    type: [Number],
  })
  bookedSeats: number[];
}

import { IsNotEmpty, IsString } from 'class-validator';

export class RejectCoinRequestDto {
  @IsNotEmpty()
  @IsString()
  rejectedReason: string;
}

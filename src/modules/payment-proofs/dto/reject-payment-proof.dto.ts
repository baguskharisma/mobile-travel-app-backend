import { IsNotEmpty, IsString } from 'class-validator';

export class RejectPaymentProofDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  rejectionReason: string;
}

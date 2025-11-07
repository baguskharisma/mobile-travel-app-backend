import { IsOptional, IsString } from 'class-validator';

export class ApprovePaymentProofDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

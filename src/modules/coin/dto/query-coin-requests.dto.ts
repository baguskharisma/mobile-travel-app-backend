import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CoinRequestStatus } from '../../../../generated/prisma';

export class QueryCoinRequestsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(CoinRequestStatus)
  status?: CoinRequestStatus;
}

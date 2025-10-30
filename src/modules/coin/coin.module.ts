import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CoinRequestService } from './services/coin-request.service';
import { CoinTransactionService } from './services/coin-transaction.service';
import { CoinRequestController } from './coin-request.controller';
import {
  CoinTransactionController,
  AdminCoinController,
} from './coin-transaction.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CoinRequestController,
    CoinTransactionController,
    AdminCoinController,
  ],
  providers: [CoinRequestService, CoinTransactionService],
  exports: [CoinTransactionService], // Export so other modules can use it
})
export class CoinModule {}

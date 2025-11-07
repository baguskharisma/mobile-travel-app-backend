import { Module } from '@nestjs/common';
import { PaymentProofsService } from './payment-proofs.service';
import { PaymentProofsController } from './payment-proofs.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CoinModule } from '../coin/coin.module';

@Module({
  imports: [PrismaModule, CoinModule],
  controllers: [PaymentProofsController],
  providers: [PaymentProofsService],
  exports: [PaymentProofsService],
})
export class PaymentProofsModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CoinModule } from '../coin/coin.module';
import { TravelDocumentsService } from './travel-documents.service';
import { TravelDocumentsController } from './travel-documents.controller';

@Module({
  imports: [PrismaModule, CoinModule],
  controllers: [TravelDocumentsController],
  providers: [TravelDocumentsService],
  exports: [TravelDocumentsService],
})
export class TravelDocumentsModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CoinModule } from '../coin/coin.module';
import { WebsocketModule } from '../../websocket/websocket.module';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

@Module({
  imports: [PrismaModule, CoinModule, WebsocketModule], // Import CoinModule for coin deduction
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TripLogsModule } from '../trip-logs/trip-logs.module';
import { DriverPanelService } from './driver-panel.service';
import { DriverPanelController } from './driver-panel.controller';

@Module({
  imports: [PrismaModule, TripLogsModule],
  controllers: [DriverPanelController],
  providers: [DriverPanelService],
  exports: [DriverPanelService],
})
export class DriverPanelModule {}

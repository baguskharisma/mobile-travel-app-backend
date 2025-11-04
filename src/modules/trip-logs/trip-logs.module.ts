import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TripLogsService } from './trip-logs.service';

@Module({
  imports: [PrismaModule],
  providers: [TripLogsService],
  exports: [TripLogsService],
})
export class TripLogsModule {}

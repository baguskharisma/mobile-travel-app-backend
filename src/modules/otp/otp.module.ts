import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TwilioService } from '../../shared/services/twilio.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, PrismaService, TwilioService],
  exports: [OtpService], // Export agar bisa digunakan di module lain (auth)
})
export class OtpModule {}

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TwilioService } from '../../shared/services/twilio.service';
import { OtpType, OtpStatus } from '@prisma/client';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private prisma: PrismaService,
    private twilioService: TwilioService,
  ) {}

  /**
   * Mengirim OTP ke nomor HP via WhatsApp
   */
  async sendOtp(phone: string, type: OtpType = OtpType.REGISTRATION) {
    // Cek apakah ada OTP aktif yang belum expired
    const existingOtp = await this.prisma.otp.findFirst({
      where: {
        phone,
        type,
        status: OtpStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Jika ada OTP yang masih berlaku, batalkan kirim ulang (throttling)
    if (existingOtp) {
      const secondsRemaining = Math.floor((existingOtp.expiresAt.getTime() - Date.now()) / 1000);

      if (secondsRemaining > 240) { // Jika masih ada lebih dari 4 menit
        throw new BadRequestException(
          `OTP already sent. Please wait ${secondsRemaining} seconds before requesting a new one.`
        );
      }

      // Jika kurang dari 1 menit, izinkan kirim ulang dan expire yang lama
      await this.prisma.otp.update({
        where: { id: existingOtp.id },
        data: { status: OtpStatus.EXPIRED },
      });
    }

    // Generate kode OTP
    const otpCode = this.twilioService.generateOtpCode();

    // Simpan OTP ke database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    const otp = await this.prisma.otp.create({
      data: {
        phone,
        code: otpCode,
        type,
        status: OtpStatus.PENDING,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        expiresAt,
      },
    });

    // Kirim OTP via WhatsApp menggunakan Twilio
    const sendResult = await this.twilioService.sendWhatsAppOTP(phone, otpCode);

    if (!sendResult.success) {
      this.logger.error(`Failed to send OTP to ${phone}: ${sendResult.error}`);

      // Update status OTP menjadi FAILED
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { status: OtpStatus.FAILED },
      });

      throw new BadRequestException('Failed to send OTP via WhatsApp. Please try again later.');
    }

    this.logger.log(`OTP sent successfully to ${phone}. Message SID: ${sendResult.messageSid}`);

    return {
      message: 'OTP sent successfully to your WhatsApp',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60, // dalam detik
      phone,
    };
  }

  /**
   * Verifikasi kode OTP
   */
  async verifyOtp(phone: string, code: string, type: OtpType = OtpType.REGISTRATION) {
    // Cari OTP yang aktif
    const otp = await this.prisma.otp.findFirst({
      where: {
        phone,
        type,
        status: OtpStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      throw new BadRequestException('No active OTP found for this phone number');
    }

    // Cek apakah sudah expired
    if (new Date() > otp.expiresAt) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { status: OtpStatus.EXPIRED },
      });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Cek apakah sudah melebihi max attempts
    if (otp.attempts >= otp.maxAttempts) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { status: OtpStatus.FAILED },
      });
      throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    // Increment attempts
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    });

    // Verifikasi kode OTP
    if (otp.code !== code) {
      const remainingAttempts = otp.maxAttempts - (otp.attempts + 1);
      throw new BadRequestException(
        `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
      );
    }

    // OTP valid, update status
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: {
        status: OtpStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    this.logger.log(`OTP verified successfully for ${phone}`);

    return {
      message: 'OTP verified successfully',
      verified: true,
      phone,
    };
  }

  /**
   * Cek apakah nomor HP sudah terverifikasi OTP (untuk registrasi)
   */
  async isPhoneVerified(phone: string, type: OtpType = OtpType.REGISTRATION): Promise<boolean> {
    const verifiedOtp = await this.prisma.otp.findFirst({
      where: {
        phone,
        type,
        status: OtpStatus.VERIFIED,
      },
      orderBy: {
        verifiedAt: 'desc',
      },
    });

    // Verifikasi masih berlaku jika dilakukan dalam 30 menit terakhir
    if (verifiedOtp && verifiedOtp.verifiedAt) {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      return verifiedOtp.verifiedAt > thirtyMinutesAgo;
    }

    return false;
  }

  /**
   * Cleanup OTP yang sudah expired (bisa dipanggil via cron job)
   */
  async cleanupExpiredOtp() {
    const result = await this.prisma.otp.updateMany({
      where: {
        status: OtpStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: OtpStatus.EXPIRED,
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired OTP records`);
    return result;
  }
}

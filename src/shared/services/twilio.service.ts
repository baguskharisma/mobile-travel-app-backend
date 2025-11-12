import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private twilioClient: twilio.Twilio | null = null;
  private readonly fromWhatsAppNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromWhatsAppNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

    if (!accountSid || !authToken || !this.fromWhatsAppNumber) {
      this.logger.warn('Twilio credentials not configured. WhatsApp OTP will not work.');
    } else {
      this.twilioClient = twilio.default(accountSid, authToken);
      this.logger.log('Twilio service initialized successfully');
    }
  }

  /**
   * Mengirim OTP melalui WhatsApp
   * @param phone - Nomor HP tujuan (format: +62xxx atau 08xxx)
   * @param otpCode - Kode OTP yang akan dikirim
   * @returns Promise dengan message SID atau error
   */
  async sendWhatsAppOTP(phone: string, otpCode: string): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    try {
      // Normalisasi nomor HP ke format internasional
      const normalizedPhone = this.normalizePhoneNumber(phone);

      if (!this.twilioClient) {
        this.logger.error('Twilio client not initialized');
        return { success: false, error: 'Twilio service not configured' };
      }

      // Template pesan OTP
      const message = `Kode OTP Anda adalah: ${otpCode}\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.\n\nMobile Travel App`;

      // Kirim pesan WhatsApp
      const response = await this.twilioClient.messages.create({
        from: `whatsapp:${this.fromWhatsAppNumber}`,
        to: `whatsapp:${normalizedPhone}`,
        body: message,
      });

      this.logger.log(`WhatsApp OTP sent successfully to ${normalizedPhone}. Message SID: ${response.sid}`);

      return {
        success: true,
        messageSid: response.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp OTP to ${phone}:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to send OTP via WhatsApp',
      };
    }
  }

  /**
   * Normalisasi nomor HP ke format internasional
   * @param phone - Nomor HP (format: +62xxx, 62xxx, atau 08xxx)
   * @returns Nomor HP dalam format internasional (+62xxx)
   */
  private normalizePhoneNumber(phone: string): string {
    // Hapus semua karakter non-digit
    let normalized = phone.replace(/\D/g, '');

    // Konversi ke format internasional
    if (normalized.startsWith('0')) {
      // 08xxx -> +62xxx
      normalized = '62' + normalized.substring(1);
    } else if (normalized.startsWith('62')) {
      // 62xxx sudah benar
      normalized = normalized;
    } else if (normalized.startsWith('+62')) {
      // +62xxx sudah benar
      normalized = normalized.substring(1);
    }

    return '+' + normalized;
  }

  /**
   * Generate kode OTP 6 digit
   * @returns Kode OTP berupa string 6 digit
   */
  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

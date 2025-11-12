import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { OtpType } from '@prisma/client';

@ApiTags('OTP Verification')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Public()
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send OTP via WhatsApp',
    description: 'Mengirim kode OTP 6 digit ke nomor WhatsApp untuk verifikasi registrasi. Kode berlaku selama 5 menit.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        message: 'OTP sent successfully to your WhatsApp',
        expiresIn: 300,
        phone: '081234567890',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid phone number or OTP already sent',
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.otpService.sendOtp(sendOtpDto.phone, OtpType.REGISTRATION);
  }

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP code',
    description: 'Memverifikasi kode OTP yang dikirim via WhatsApp. Maksimal 3 kali percobaan.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      example: {
        message: 'OTP verified successfully',
        verified: true,
        phone: '081234567890',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid OTP, expired, or max attempts exceeded',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code, OtpType.REGISTRATION);
  }
}

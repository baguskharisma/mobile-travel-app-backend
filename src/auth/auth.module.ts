import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaModule } from '../prisma/prisma.module';
// import { OtpModule } from '../modules/otp/otp.module'; // Commented out - OTP verification disabled

@Module({
  imports: [
    PrismaModule,
    // OtpModule, // Commented out - OTP verification disabled
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // Configuration will be done in service using signAsync
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_REFRESH_SECRET ||
        'your-refresh-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Verify token type
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Get user from database
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null, // Filter out soft-deleted users
      },
      include: {
        admin: true,
        driver: true,
        customer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // Return user object
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.admin || user.driver || user.customer || null,
    };
  }
}

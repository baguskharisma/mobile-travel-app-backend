import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET || 'your-secret-key-change-in-production',
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extract token from request
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    // Check if token is blacklisted
    if (token) {
      const isBlacklisted = await this.prisma.tokenBlacklist.findUnique({
        where: { token },
      });

      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    // Verify token type
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Get user from database to ensure they still exist and are active
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

    // Return user object that will be attached to request
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.admin || user.driver || user.customer || null,
    };
  }
}

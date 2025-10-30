import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { JwtPayload } from './types/jwt-payload.type';
import { UserRole } from '../../generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null, // Filter out soft-deleted users
      },
      include: {
        admin: true,
        driver: true,
        customer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Get profile based on role
    const profile = user.admin || user.driver || user.customer || null;

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: profile
          ? {
              id: profile.id,
              name: profile.name,
              phone: profile.phone,
            }
          : null,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, phone, address } = registerDto;

    // Check if email already exists
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists
    const existingUserByPhone = await this.prisma.customer.findUnique({
      where: { phone },
    });

    if (existingUserByPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user with customer profile in transaction
    const user = await this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.CUSTOMER,
          status: 'ACTIVE',
        },
      });

      const customer = await prisma.customer.create({
        data: {
          userId: newUser.id,
          name,
          phone,
          address: address || null,
        },
      });

      return {
        ...newUser,
        customer,
      };
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: {
          id: user.customer.id,
          name: user.customer.name,
          phone: user.customer.phone,
        },
      },
    };
  }

  async refreshToken(userId: string): Promise<AuthResponseDto> {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Get profile based on role
    const profile = user.admin || user.driver || user.customer || null;

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: profile
          ? {
              id: profile.id,
              name: profile.name,
              phone: profile.phone,
            }
          : null,
      },
    };
  }

  private async generateTokens(
    userId: string,
    email: string | null,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        accessPayload as any,
        {
          secret:
            process.env.JWT_ACCESS_SECRET ||
            'your-secret-key-change-in-production',
          expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h',
        } as any,
      ),
      this.jwtService.signAsync(
        refreshPayload as any,
        {
          secret:
            process.env.JWT_REFRESH_SECRET ||
            'your-refresh-secret-key-change-in-production',
          expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
        } as any,
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        admin: true,
        driver: true,
        customer: true,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const profile = user.admin || user.driver || user.customer || null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile,
    };
  }
}

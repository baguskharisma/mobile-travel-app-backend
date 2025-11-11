import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { Public, CurrentUser } from './decorators';
import type { CurrentUserType } from './decorators';
import { JwtRefreshGuard } from './guards';
import type { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @CurrentUser() user: CurrentUserType,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(user.id);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: CurrentUserType) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
    };
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revokes the current access token by adding it to the blacklist. User must be authenticated.'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logout successful'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token'
  })
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: CurrentUserType,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { message: 'No token provided' };
    }

    return this.authService.logout(token, user.id);
  }
}

import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  phone: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

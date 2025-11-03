import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  email: string | null;
  role: UserRole;
  type: 'access' | 'refresh';
}

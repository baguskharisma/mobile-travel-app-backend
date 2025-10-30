import { UserRole } from '../../../generated/prisma';

export interface JwtPayload {
  sub: string; // User ID
  email: string | null;
  role: UserRole;
  type: 'access' | 'refresh';
}

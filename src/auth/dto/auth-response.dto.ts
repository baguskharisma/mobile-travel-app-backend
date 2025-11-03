import { UserRole, UserStatus } from '@prisma/client';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    role: UserRole;
    status: UserStatus;
    profile: {
      id: string;
      name: string;
      phone: string;
    } | null;
  };
}

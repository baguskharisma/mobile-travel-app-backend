import { UserStatus } from '../../../../generated/prisma';

export class AdminResponseDto {
  id: string;
  name: string;
  phone: string;
  coinBalance: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string | null;
    status: UserStatus;
    createdAt: Date;
  };
}

export class PaginatedAdminResponseDto {
  data: AdminResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

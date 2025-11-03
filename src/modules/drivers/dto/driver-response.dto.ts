import { DriverStatus, UserStatus } from '@prisma/client';

export class DriverResponseDto {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string | null;
  address: string | null;
  status: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string | null;
    status: UserStatus;
    createdAt: Date;
  };
}

export class PaginatedDriverResponseDto {
  data: DriverResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

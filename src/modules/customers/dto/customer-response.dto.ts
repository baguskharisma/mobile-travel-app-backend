import { UserStatus } from '../../../../generated/prisma';

export class CustomerResponseDto {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string | null;
    status: UserStatus;
    createdAt: Date;
  };
}

export class PaginatedCustomerResponseDto {
  data: CustomerResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

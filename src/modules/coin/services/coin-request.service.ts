import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateCoinRequestDto,
  QueryCoinRequestsDto,
  ApproveCoinRequestDto,
  RejectCoinRequestDto,
} from '../dto';
import {
  CoinRequestStatus,
  CoinTransactionReason,
  UserRole,
} from '@prisma/client';
import { CoinTransactionService } from './coin-transaction.service';

@Injectable()
export class CoinRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinTransactionService: CoinTransactionService,
  ) {}

  /**
   * Admin creates a coin top-up request
   */
  async create(adminId: string, createDto: CreateCoinRequestDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Super admin cannot request coins for themselves
    if (admin.user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Super Admin cannot request coins');
    }

    const coinRequest = await this.prisma.coinRequest.create({
      data: {
        adminId,
        amount: createDto.amount,
        notes: createDto.notes,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
            coinBalance: true,
          },
        },
      },
    });

    return coinRequest;
  }

  /**
   * List coin requests with filters
   */
  async findAll(query: QueryCoinRequestsDto, userId?: string) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    // If userId is provided, check if they're super admin or regular admin
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { admin: true },
      });

      // Regular admins can only see their own requests
      if (user && user.role === UserRole.ADMIN && user.admin) {
        where.adminId = user.admin.id;
      }
      // Super admin can see all requests (no additional filter needed)
    }

    const [requests, total] = await Promise.all([
      this.prisma.coinRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
              coinBalance: true,
            },
          },
        },
      }),
      this.prisma.coinRequest.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single coin request
   */
  async findOne(id: string, userId?: string) {
    const request = await this.prisma.coinRequest.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
            coinBalance: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Coin request not found');
    }

    // Check if user has permission to view this request
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { admin: true },
      });

      if (
        user &&
        user.role === UserRole.ADMIN &&
        user.admin &&
        user.admin.id !== request.adminId
      ) {
        throw new ForbiddenException('You can only view your own coin requests');
      }
    }

    return request;
  }

  /**
   * Super admin approves a coin request
   */
  async approve(
    id: string,
    superAdminUserId: string,
    approveDto: ApproveCoinRequestDto,
  ) {
    // Verify super admin
    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminUserId },
    });

    if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can approve coin requests');
    }

    // Get coin request
    const request = await this.prisma.coinRequest.findUnique({
      where: { id },
      include: {
        admin: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Coin request not found');
    }

    if (request.status !== CoinRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve request with status: ${request.status}`,
      );
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Update coin request
      const updatedRequest = await prisma.coinRequest.update({
        where: { id },
        data: {
          status: CoinRequestStatus.APPROVED,
          approvedBy: superAdminUserId,
          approvedAt: new Date(),
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
              coinBalance: true,
            },
          },
        },
      });

      // Add coins to admin balance
      await this.coinTransactionService.createTransaction(
        request.adminId,
        'TOP_UP' as any,
        CoinTransactionReason.TOP_UP_APPROVED,
        request.amount,
        {
          referenceId: request.id,
          referenceType: 'coin_request',
          notes: approveDto.notes || `Approved by Super Admin`,
          createdBy: superAdminUserId,
          prismaClient: prisma,
        },
      );

      return updatedRequest;
    });
  }

  /**
   * Super admin rejects a coin request
   */
  async reject(
    id: string,
    superAdminUserId: string,
    rejectDto: RejectCoinRequestDto,
  ) {
    // Verify super admin
    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminUserId },
    });

    if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can reject coin requests');
    }

    // Get coin request
    const request = await this.prisma.coinRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Coin request not found');
    }

    if (request.status !== CoinRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject request with status: ${request.status}`,
      );
    }

    const updatedRequest = await this.prisma.coinRequest.update({
      where: { id },
      data: {
        status: CoinRequestStatus.REJECTED,
        rejectedReason: rejectDto.rejectedReason,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
            coinBalance: true,
          },
        },
      },
    });

    return updatedRequest;
  }
}

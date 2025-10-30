import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CoinTransactionType,
  CoinTransactionReason,
  Prisma,
} from '../../../../generated/prisma';
import { QueryCoinTransactionsDto } from '../dto';

@Injectable()
export class CoinTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a coin transaction and update admin balance
   * This method should be used within a Prisma transaction
   */
  async createTransaction(
    adminId: string,
    type: CoinTransactionType,
    reason: CoinTransactionReason,
    amount: number,
    options?: {
      referenceId?: string;
      referenceType?: string;
      notes?: string;
      createdBy?: string;
      prismaClient?: Prisma.TransactionClient;
    },
  ) {
    const prismaClient = options?.prismaClient || this.prisma;

    // Get current admin balance
    const admin = await prismaClient.admin.findUnique({
      where: { id: adminId },
      select: { coinBalance: true },
    });

    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    const balanceBefore = admin.coinBalance;
    const balanceAfter = balanceBefore + amount;

    // Validate balance won't go negative
    if (balanceAfter < 0) {
      throw new BadRequestException('Insufficient coin balance');
    }

    // Create transaction record
    const transaction = await prismaClient.coinTransaction.create({
      data: {
        adminId,
        type,
        reason,
        amount,
        balanceBefore,
        balanceAfter,
        referenceId: options?.referenceId,
        referenceType: options?.referenceType,
        notes: options?.notes,
        createdBy: options?.createdBy,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Update admin balance
    await prismaClient.admin.update({
      where: { id: adminId },
      data: { coinBalance: balanceAfter },
    });

    return transaction;
  }

  /**
   * Add coins to admin balance (TOP_UP)
   */
  async addCoins(
    adminId: string,
    amount: number,
    reason: CoinTransactionReason,
    options?: {
      referenceId?: string;
      referenceType?: string;
      notes?: string;
      createdBy?: string;
    },
  ) {
    return this.createTransaction(
      adminId,
      CoinTransactionType.TOP_UP,
      reason,
      amount,
      options,
    );
  }

  /**
   * Deduct coins from admin balance (DEDUCTION)
   */
  async deductCoins(
    adminId: string,
    amount: number,
    reason: CoinTransactionReason,
    options?: {
      referenceId?: string;
      referenceType?: string;
      notes?: string;
      createdBy?: string;
      prismaClient?: Prisma.TransactionClient;
    },
  ) {
    return this.createTransaction(
      adminId,
      CoinTransactionType.DEDUCTION,
      reason,
      -amount, // Negative amount for deduction
      options,
    );
  }

  /**
   * Refund coins to admin balance (REFUND)
   */
  async refundCoins(
    adminId: string,
    amount: number,
    reason: CoinTransactionReason,
    options?: {
      referenceId?: string;
      referenceType?: string;
      notes?: string;
      createdBy?: string;
    },
  ) {
    return this.createTransaction(
      adminId,
      CoinTransactionType.REFUND,
      reason,
      amount,
      options,
    );
  }

  /**
   * Get admin coin balance
   */
  async getBalance(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        coinBalance: true,
      },
    });

    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    return admin;
  }

  /**
   * Validate if admin has sufficient balance
   */
  async validateBalance(adminId: string, requiredAmount: number): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { coinBalance: true },
    });

    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    return admin.coinBalance >= requiredAmount;
  }

  /**
   * List coin transactions with pagination and filters
   */
  async findAll(adminId: string, query: QueryCoinTransactionsDto) {
    const { page = 1, limit = 10, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      adminId,
    };

    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.coinTransaction.findMany({
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
            },
          },
        },
      }),
      this.prisma.coinTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all transactions (for super admin)
   */
  async findAllTransactions(query: QueryCoinTransactionsDto) {
    const { page = 1, limit = 10, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.coinTransaction.findMany({
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
            },
          },
        },
      }),
      this.prisma.coinTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

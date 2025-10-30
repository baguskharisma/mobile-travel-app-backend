import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryCustomersDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCustomersDto) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user: {
        deletedAt: null, // Filter out soft-deleted users
      },
    };

    if (status) {
      where.user = {
        ...where.user,
        status,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { address: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.customer.count({ where });

    // Get paginated customers
    const customers = await this.prisma.customer.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        user: {
          deletedAt: null, // Filter out soft-deleted users
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if phone number is already taken by another customer
    if (updateCustomerDto.phone) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { phone: updateCustomerDto.phone },
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return updatedCustomer;
  }
}

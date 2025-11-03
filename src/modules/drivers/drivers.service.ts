import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDriverDto, QueryDriversDto, UpdateDriverDto, UpdateDriverStatusDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDriverDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists for drivers
    const existingPhone = await this.prisma.driver.findUnique({
      where: { phone: createDriverDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Create driver with user in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const hashedPassword = await bcrypt.hash(createDriverDto.password, 10);

      const user = await prisma.user.create({
        data: {
          email: createDriverDto.email,
          password: hashedPassword,
          role: UserRole.DRIVER,
        },
      });

      const driver = await prisma.driver.create({
        data: {
          userId: user.id,
          name: createDriverDto.name,
          phone: createDriverDto.phone,
          licenseNumber: createDriverDto.licenseNumber,
          address: createDriverDto.address,
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
        },
      });

      return driver;
    });
  }

  async findAll(query: QueryDriversDto) {
    const { page = 1, limit = 10, driverStatus, userStatus, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user: {
        deletedAt: null, // Filter out soft-deleted users
      },
    };

    if (driverStatus) {
      where.status = driverStatus;
    }

    if (userStatus) {
      where.user = {
        ...where.user,
        status: userStatus,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.driver.count({ where });

    // Get paginated drivers
    const drivers = await this.prisma.driver.findMany({
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
      data: drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.prisma.driver.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check if phone number is already taken by another driver
    if (updateDriverDto.phone) {
      const existingDriver = await this.prisma.driver.findUnique({
        where: { phone: updateDriverDto.phone },
      });

      if (existingDriver && existingDriver.id !== id) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: updateDriverDto,
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

    return updatedDriver;
  }

  async updateStatus(id: string, updateStatusDto: UpdateDriverStatusDto) {
    const driver = await this.prisma.driver.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: { status: updateStatusDto.status },
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

    return updatedDriver;
  }
}

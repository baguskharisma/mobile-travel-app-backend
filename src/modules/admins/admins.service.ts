import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminDto, QueryAdminsDto, UpdateAdminDto, UpdateAdminStatusDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAdminDto: CreateAdminDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists for admins
    const existingPhone = await this.prisma.admin.findUnique({
      where: { phone: createAdminDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Create admin with user in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

      const user = await prisma.user.create({
        data: {
          email: createAdminDto.email,
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });

      const admin = await prisma.admin.create({
        data: {
          userId: user.id,
          name: createAdminDto.name,
          phone: createAdminDto.phone,
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

      return admin;
    });
  }

  async findAll(query: QueryAdminsDto) {
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
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.admin.count({ where });

    // Get paginated admins
    const admins = await this.prisma.admin.findMany({
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
      data: admins,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findFirst({
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
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin profile from being updated
    if (admin.user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot update Super Admin profile');
    }

    // Check if phone number is already taken by another admin
    if (updateAdminDto.phone) {
      const existingAdmin = await this.prisma.admin.findUnique({
        where: { phone: updateAdminDto.phone },
      });

      if (existingAdmin && existingAdmin.id !== id) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedAdmin = await this.prisma.admin.update({
      where: { id },
      data: updateAdminDto,
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

    return updatedAdmin;
  }

  async updateStatus(id: string, updateStatusDto: UpdateAdminStatusDto) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin from being deactivated
    if (admin.user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot change Super Admin status');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: admin.userId },
      data: { status: updateStatusDto.status },
      include: {
        admin: {
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
        },
      },
    });

    return updatedUser.admin;
  }

  async remove(id: string) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin from being deleted
    if (admin.user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete Super Admin');
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id: admin.userId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Admin deleted successfully' };
  }

  async restore(id: string) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: { not: null },
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Deleted admin not found');
    }

    // Restore user
    const restoredUser = await this.prisma.user.update({
      where: { id: admin.userId },
      data: { deletedAt: null },
      include: {
        admin: {
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
        },
      },
    });

    return restoredUser.admin;
  }
}
